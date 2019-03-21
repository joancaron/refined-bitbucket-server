import features from '../libs/features';
import select from 'select-dom';
import { getIconForFile, getIconForFolder } from 'vscode-icons-js';
import { waitForAjaxElement } from '../libs/dom-utils';
import React from 'dom-chef';

function getImgTag(icon: string) {
  return (
    <img
      className="jstree-icon aui-icon"
      src={browser.runtime.getURL('content/icons/' + icon)}
      alt={icon}
    />
  );
}

async function init() {
  if (features.isPRDetailsDiff()) {
    await waitForAjaxElement('.jstree');

    const files = select.all('.difftree-file');
    const folders = select.all('.aui-iconfont-folder-filled');

    files.forEach(file =>
      file.replaceChild(
        getImgTag(getIconForFile(file.getAttribute('href'))),
        file.firstChild
      )
    );

    folders.forEach(folder =>
      folder.replaceWith(
        getImgTag(getIconForFolder(folder.parentElement.textContent))
      )
    );
  } else if (features.isSource()) {
    const sourceFiles = select.all('.file-row');
    sourceFiles.forEach(sourceFile => {
      const name = sourceFile.dataset.itemName;
      sourceFile
        .querySelector('.aui-icon')
        .replaceWith(
          getImgTag(
            sourceFile.classList.contains('file')
              ? getIconForFile(name)
              : getIconForFolder(name)
          )
        );
    });
  }
}

features.add({
  id: 'source-icons',
  include: [features.isPRDetailsDiff, features.isSource],
  load: features.onAjaxedPages,
  init,
});
