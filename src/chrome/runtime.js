/* eslint-disable no-undef */
function reload() {
    chrome.runtime.reload();
}

function getURL(src) {
    return chrome.extension.getURL(src);
}

export { reload, getURL };
