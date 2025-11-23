#!/usr/bin/env node

/**
 * @fileoverview Script Executável - Testes do Sistema de Sorteio Flor de Lis
 * @description Interface de linha de comando para executar testes automatizados
 * 
 * Uso:
 *   node run-tests.js               # Executa todos os testes
 *   node run-tests.js --sorteio     # Executa apenas teste principal
 *   node run-tests.js --edge        # Executa apenas casos extremos  
 *   node run-tests.js --coverage    # Executa com relatório de cobertura
 *   node run-tests.js --watch       # Executa em modo watch
 *   node run-tests.js --silent      # Executa sem logs detalhados
 */

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== CONFIGURAÇÃO ====================

const CONFIG = {
    testDir: join(__dirname, 'src', 'tests'),
    nodeModules: join(__dirname, 'node_modules'),
    packageJson: join(__dirname, 'package-tests.json')
};

// Cores para output
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// ==================== FUNÇÕES AUXILIARES ====================

function colorize(text, color) {
    return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader() {
    console.log(colorize('\n🎯 ===== SISTEMA DE TESTES - SORTEIO GARAGENS FLOR DE LIS =====', 'cyan'));
    console.log(colorize('📋 Executando validação completa do sistema de sorteio', 'blue'));
    console.log(colorize(`📁 Diretório de testes: ${CONFIG.testDir}`, 'yellow'));
    console.log(colorize('🔧 Configurando ambiente de testes...', 'green'));
}

function printUsage() {
    console.log(colorize('\n📖 USO:', 'bright'));
    console.log('  node run-tests.js [opções]');
    console.log('\n🚀 OPÇÕES:');
    console.log(colorize('  --all        ', 'green') + 'Executa todos os testes (padrão)');
    console.log(colorize('  --sorteio    ', 'green') + 'Executa apenas o teste principal de sorteio');
    console.log(colorize('  --edge       ', 'green') + 'Executa apenas testes de casos extremos');
    console.log(colorize('  --coverage   ', 'green') + 'Executa com relatório de cobertura');
    console.log(colorize('  --watch      ', 'green') + 'Executa em modo watch (re-executa ao salvar)');
    console.log(colorize('  --silent     ', 'green') + 'Executa sem logs detalhados');
    console.log(colorize('  --help       ', 'green') + 'Mostra esta ajuda');
    console.log('\n📝 EXEMPLOS:');
    console.log('  node run-tests.js --sorteio --silent');
    console.log('  node run-tests.js --coverage');
    console.log('  node run-tests.js --watch --edge');
}

function checkPrerequisites() {
    console.log(colorize('🔍 Verificando pré-requisitos...', 'yellow'));

    // Verificar se Node.js está disponível
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log(colorize(`✅ Node.js: ${nodeVersion}`, 'green'));
    } catch (error) {
        console.error(colorize('❌ Node.js não encontrado!', 'red'));
        process.exit(1);
    }

    // Verificar se npm está disponível
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        console.log(colorize(`✅ npm: v${npmVersion}`, 'green'));
    } catch (error) {
        console.error(colorize('❌ npm não encontrado!', 'red'));
        process.exit(1);
    }

    // Verificar se diretório de testes existe
    if (!fs.existsSync(CONFIG.testDir)) {
        console.error(colorize(`❌ Diretório de testes não encontrado: ${CONFIG.testDir}`, 'red'));
        process.exit(1);
    }

    console.log(colorize('✅ Todos os pré-requisitos atendidos!', 'green'));
}

function installDependencies() {
    console.log(colorize('📦 Verificando dependências...', 'yellow'));

    if (!fs.existsSync(CONFIG.nodeModules)) {
        console.log(colorize('📦 Instalando dependências de teste...', 'blue'));

        try {
            execSync('npm install --package-lock-only --package-lock=false', {
                stdio: 'inherit',
                cwd: __dirname
            });

            execSync('npm install @jest/globals jest @babel/preset-env babel-jest', {
                stdio: 'inherit',
                cwd: __dirname
            });

            console.log(colorize('✅ Dependências instaladas!', 'green'));
        } catch (error) {
            console.error(colorize('❌ Falha na instalação de dependências!', 'red'));
            console.error(error.message);
            process.exit(1);
        }
    } else {
        console.log(colorize('✅ Dependências já instaladas!', 'green'));
    }
}

function runTests(options = {}) {
    console.log(colorize('\n🚀 Iniciando execução dos testes...', 'cyan'));

    const jestArgs = ['--config', JSON.stringify({
        preset: 'default',
        testEnvironment: 'node',
        transform: {
            '^.+\\.js$': 'babel-jest'
        },
        moduleNameMapping: {
            '^(\\.{1,2}/.*)\\.js$': '$1'
        },
        setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.js'],
        verbose: !options.silent
    })];

    // Adicionar filtros baseados nas opções
    if (options.sorteio) {
        jestArgs.push('--testNamePattern', 'Sorteio completo');
    } else if (options.edge) {
        jestArgs.push('--testPathPattern', 'edge-cases');
    }

    // Adicionar opções especiais
    if (options.coverage) {
        jestArgs.push('--coverage');
    }

    if (options.watch) {
        jestArgs.push('--watch');
    }

    if (options.silent) {
        jestArgs.push('--silent');
    }

    // Executar Jest
    const jestCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const jest = spawn(jestCommand, ['jest', ...jestArgs], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: 'test' }
    });

    jest.on('close', (code) => {
        if (code === 0) {
            console.log(colorize('\n✅ Todos os testes passaram com sucesso!', 'green'));
            console.log(colorize('🎯 Sistema de sorteio validado completamente!', 'bright'));
        } else {
            console.log(colorize('\n❌ Alguns testes falharam!', 'red'));
            console.log(colorize('🔧 Verifique os logs acima para detalhes', 'yellow'));
        }
        process.exit(code);
    });

    jest.on('error', (error) => {
        console.error(colorize('❌ Erro ao executar Jest:', 'red'));
        console.error(error.message);
        process.exit(1);
    });
}

// ==================== MAIN ====================

function main() {
    const args = process.argv.slice(2);

    // Verificar se é pedido de ajuda
    if (args.includes('--help') || args.includes('-h')) {
        printUsage();
        process.exit(0);
    }

    printHeader();

    // Verificar pré-requisitos
    checkPrerequisites();

    // Instalar dependências se necessário
    installDependencies();

    // Processar opções
    const options = {
        sorteio: args.includes('--sorteio'),
        edge: args.includes('--edge'),
        coverage: args.includes('--coverage'),
        watch: args.includes('--watch'),
        silent: args.includes('--silent')
    };

    // Mostrar configuração
    console.log(colorize('\n🎛️ CONFIGURAÇÃO DOS TESTES:', 'magenta'));
    console.log(`  📋 Teste principal: ${options.sorteio ? '✅' : '❌'}`);
    console.log(`  🔍 Casos extremos: ${options.edge ? '✅' : '❌'}`);
    console.log(`  📊 Cobertura: ${options.coverage ? '✅' : '❌'}`);
    console.log(`  👀 Watch mode: ${options.watch ? '✅' : '❌'}`);
    console.log(`  🤫 Modo silencioso: ${options.silent ? '✅' : '❌'}`);

    // Executar testes
    runTests(options);
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main, runTests, checkPrerequisites };