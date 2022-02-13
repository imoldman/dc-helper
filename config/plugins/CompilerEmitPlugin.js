class CompilerEmitPlugin {
    apply(compiler) {
        CompilerEmitPlugin.innerCompiler = compiler;
    }
    static innerCompiler;
}

module.exports = CompilerEmitPlugin;
