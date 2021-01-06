(async () => {
    const flsConfig = {
        id: 'c',
        fileUri: 'file:///app/lang-envs/c/Test.c',
        extensions: [ '.c', '.cc'],
        aliases: ['C', 'c'],
        workSpaceUri: 'file:///app/lang-envs/env/c/',
        fls_url: 'wss://stg-fls-c.filtered.ai/lang-server'
    }
    const flsConfig_no_lsp = {
        id: 'c',
        fileUri: 'file:///app/lang-envs/c/Test.c',
        extensions: [ '.c', '.cc'],
        aliases: ['C', 'c'],
        workSpaceUri: 'file:///app/lang-envs/env/c/',
        fls_url: ''
    }
    document.getElementById('js-init-lsp').onclick = function(e){
        initializeMonacoEditor(flsConfig, '', document.getElementById('js-monaco-editor'));
    }
    document.getElementById('js-init-no-lsp').onclick = function(e){
        initializeMonacoEditor(flsConfig_no_lsp, '', document.getElementById('js-monaco-editor'));
    }

})();
const initializeMonacoEditor = function (flsConfig, code, editorDom) {
    try {
        let editor = createEditor({ code, flsConfig, editorDom });
        if (!editor || typeof editor.getValue !== 'function') {
            console.error(new Error(`Editor did not initialized, editor value is: ${JSON.stringify(editor)}, re-creating...`));
            editor = createEditor({ code, flsConfig, editorDom });
        }
        try {
            monacoLangClient.MonacoServices.get();
        } catch (e) {
            if (e) {
                // if error exists, that means monacoService hasn't been installed yet.
                monacoLangClient.MonacoServices.install(monacoLangClient.CommandsRegistry);
            }
        }
        // add connection to window so that it can be disposed on question submit or language change.
        if (flsConfig.fls_url) {
            connectLangServerSocket({ langServerUrl: flsConfig.fls_url, langName: flsConfig.id });
        }

        setTimeout(() => {
            editor.layout();
        }, 500);

        return editor;
    } catch (e) {
        console.error(e);
    }
};
const connectLangServerSocket = function ({ langServerUrl, langName }) {
    buildSocketConnection({ langServerUrl, langName });
};
const buildSocketConnection = function ({ langServerUrl, langName }) {
    const websocket = new WebSocket(`${langServerUrl}/${langName}`);
    monacoLangClient.listen({
        webSocket: websocket,
        onConnection: (connection) => {
            const languageClient = new monacoLangClient.MonacoLanguageClient({
                name: 'Language Client',
                clientOptions: {
                    // use a language id as a document selector
                    documentSelector: [langName],
                    // disable the default error handler
                    errorHandler: {
                        error: () => monacoLangClient.ErrorAction.Continue,
                        closed: () => monacoLangClient.CloseAction.DoNotRestart
                    }
                },
                // create a language client connection from the JSON RPC connection on demand
                connectionProvider: {
                    get: (errorHandler, closeHandler) => {
                        return Promise.resolve(monacoLangClient.createConnection(connection, errorHandler, closeHandler));
                    }
                }
            });
            languageClientConnection = languageClient.start();
            languageClient.onReady().then(() => {
                console.log('monacoLangClient connection ready.');
            }).catch((e) => {
                console.error(e);
            });
            connection.onError((err) => {
                if (err && err[0]) console.error(err[0]);
                console.error('monacoLangClient connection error occurred.');
            });
            connection.onDispose(() => {
                console.log('monacoLangClient connection disposed.');
                languageClient.cleanUp();
                languageClient.stop();
            });
            connection.onClose(() => {
                console.log('monacoLangClient connection got closed.');
            });
        }
    });
    websocket.onerror = function (e) {
        console.error('Language server socket connection error.', e);
    };
    websocket.onclose = function (e) {
        console.log('Language server socket is closed. Reconnect will be attempted in 3 second.', e.reason);
    };
};
const createEditor = function ({ code, flsConfig, editorDom }) {
    // create models with language file path and other config and add it to editor instance
    const model = monaco.editor.createModel(code, flsConfig.id, monaco.Uri.parse(flsConfig.fileUri));
    return monaco.editor.create(editorDom, {
        model,
        theme: 'vs-dark',
        language: flsConfig.id,
        wordWrap: 'on',
        wrappingIndent: 'same',
        scrollBeyondLastLine: false,
        renderWhitespace: 'all',
        codeLens: false,
        formatOnPaste: true,
        fontSize: 12,
        fixedOverflowWidgets: true
    });
};