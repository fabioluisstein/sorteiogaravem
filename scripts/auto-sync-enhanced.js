import { watch } from 'fs';
import { copyFile, stat } from 'fs/promises';
import { resolve } from 'path';

const configPath = resolve('config/sorteio.properties');
const publicPath = resolve('public/sorteio.properties');

console.log('🔄 ===================================');
console.log('📋 AUTO-SYNC - Sorteio Flor de Lis');
console.log('🔄 ===================================');
console.log('🔍 Monitorando alterações em config/sorteio.properties...');
console.log(`📂 Origem: ${configPath}`);
console.log(`📂 Destino: ${publicPath}`);
console.log('✅ Auto-sync ativado - aguardando mudanças...');
console.log('');

let lastSync = null;
let syncCount = 0;

// Função para sincronizar
async function syncConfig(reason = 'manual') {
    try {
        const startTime = Date.now();

        // Verifica informações do arquivo fonte
        const stats = await stat(configPath);

        // Copia o arquivo
        await copyFile(configPath, publicPath);

        const syncTime = Date.now() - startTime;
        syncCount++;
        lastSync = new Date();

        console.log(`🔄 [${lastSync.toLocaleTimeString()}] Sincronização #${syncCount} (${reason})`);
        console.log(`   ⚡ Tempo: ${syncTime}ms`);
        console.log(`   📏 Tamanho: ${stats.size} bytes`);
        console.log(`   📅 Modificado: ${stats.mtime.toLocaleString()}`);
        console.log('   ✅ Sucesso!');
        console.log('');

    } catch (error) {
        console.error(`❌ [${new Date().toLocaleTimeString()}] Erro na sincronização (${reason}):`);
        console.error(`   🚨 ${error.message}`);
        console.error('');
    }
}

// Sincronização inicial
console.log('🔄 Executando sincronização inicial...');
await syncConfig('inicial');

// Monitora mudanças no arquivo de configuração
watch(configPath, async (eventType, filename) => {
    if (eventType === 'change') {
        // Pequeno delay para evitar múltiplas sincronizações
        await new Promise(resolve => setTimeout(resolve, 500));
        await syncConfig('automática');
    }
});

// Monitora se o processo está ativo
setInterval(() => {
    const now = new Date();
    const uptime = Math.floor((now - (lastSync || now)) / 1000);

    if (uptime > 0 && uptime % 300 === 0) { // A cada 5 minutos
        console.log(`⏰ [${now.toLocaleTimeString()}] Monitor ativo - ${syncCount} sincronizações realizadas`);
    }
}, 1000);