import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('aiChat.openChat', () => {
      const panel = vscode.window.createWebviewPanel(
        'aiChat',
        'AI Code Assistant',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'media'))
          ]
        }
      );

      const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'media', 'bundle.js'))
      );

      panel.webview.html = getWebviewContent(scriptUri);

      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'getContext') {
          const editor = vscode.window.activeTextEditor;
          const text = editor ? editor.document.getText() : '';
          panel.webview.postMessage({ command: 'context', text });
        }

        if (message.command === 'selectFile') {
          const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Attach File',
            canSelectFiles: true,
            canSelectFolders: false
          };

          const fileUri = await vscode.window.showOpenDialog(options);
          if (fileUri && fileUri[0]) {
            const filePath = fileUri[0].fsPath;
            const fileExt = path.extname(filePath).toLowerCase();
            const contentBytes = await vscode.workspace.fs.readFile(fileUri[0]);

            if (['.png', '.jpg', '.jpeg'].includes(fileExt)) {
              const fileSizeKB = (contentBytes.byteLength / 1024).toFixed(1);
              const fileMeta = `Attached image: ${path.basename(filePath)} (${fileExt}, ${fileSizeKB}KB)`;
              panel.webview.postMessage({
                command: 'fileSelected',
                input: message.input,
                fileContent: fileMeta
              });
            } else {
              const fileContent = Buffer.from(contentBytes).toString('utf-8');
              panel.webview.postMessage({
                command: 'fileSelected',
                input: message.input,
                fileContent
              });
            }
          }
        }
      });
    })
  );
}

function getWebviewContent(scriptUri: vscode.Uri): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Chat Assistant</title>
    </head>
    <body>
      <div id="root"></div>
      <script src="${scriptUri}"></script>
    </body>
    </html>
  `;
}
