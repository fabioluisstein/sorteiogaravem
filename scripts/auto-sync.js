import { watch } from 'fs';
import { copyFile } from 'fs/promises';
import { resolve } from 'path';

const configPath = resolve('config/sorteio.properties');
const publicPath = resolve('public/sorteio.properties');

console.log('🔍 Monitorando alterações em config/sorteio.properties...');
console.log('✅ Auto-sync ativado');

// Monitora mudanças no arquivo de configuração
watch(configPath, async (eventType) => {
    if (eventType === 'change') {
        try {
            await copyFile(configPath, publicPath);
            console.log(`🔄 [${new Date().toLocaleTimeString()}] Configuração sincronizada automaticamente`);
        } catch (error) {
            console.error('❌ Erro na sincronização:', error.message);
        }
    }
});