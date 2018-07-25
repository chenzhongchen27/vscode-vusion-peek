import * as vscode from 'vscode';

export default class PeekFileDefinitionProvider implements vscode.DefinitionProvider {
  targetFileExtensions: string[] = [];

  constructor(targetFileExtensions: string[] = []) {
    this.targetFileExtensions = targetFileExtensions;
  }

  getComponentName(position: vscode.Position): String[] {
    const doc = vscode.window.activeTextEditor.document;
    const selection = doc.getWordRangeAtPosition(position);
    const selectedText = doc.getText(selection);
    let possibleFileNames = [],
      altName = ''

    selectedText.match(/\w+/g).forEach(str => {
      return altName += str[0].toUpperCase() + str.substring(1);
    })

    this.targetFileExtensions.forEach(ext => {
      possibleFileNames.push(selectedText + ext)
      possibleFileNames.push(selectedText + ext + '/index.js')
      possibleFileNames.push(selectedText + '/index' + ext)
      // possibleFileNames.push(altName + ext)
      // possibleFileNames.push(altName + '/index' + ext)
    })

    return possibleFileNames;
  }

  searchFilePath(fileName: String): Thenable<vscode.Uri[]> {
    let path = '';
    path += `**/${fileName}`;
    return vscode.workspace.findFiles(path, '**/node_modules',5); // Returns promise
  }

  searchVusionFilePath(fileName: String): Thenable<vscode.Uri[]> {
    let path = '';
    path += `{`;
    path += `**/node_modules/cloud-ui.vusion/src/${fileName}`;
    path += `,**/node_modules/proto-ui.vusion/src/${fileName}`;
    path += "}"
    return vscode.workspace.findFiles(path, "!{cloud-ui.vusion,proto-ui.vusion}" ,5); // Returns promise
  }

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location | vscode.Location[]> {

    let filePaths = [];
    const componentNames = this.getComponentName(position);
    const searchPathActions = componentNames.map(this.searchFilePath);
    const searchVusionPathActions = componentNames.map(this.searchVusionFilePath);
    const searchPromises = Promise.all(searchPathActions.concat(searchVusionPathActions)); // pass array of promises

    return searchPromises.then((paths) => {
      filePaths = [].concat.apply([], paths);

      if (filePaths.length) {
        let allPaths = [];
        filePaths.forEach(filePath => {
          allPaths.push(new vscode.Location(vscode.Uri.file(`${filePath.path}`),new vscode.Position(0,1) ))
        });
        return allPaths;
      } else {
        return undefined;
      }
    }, (reason) => {
      return undefined;
    });
  }
}