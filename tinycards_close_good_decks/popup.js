const ROOT_FOLDER_TITLE = "tinycards_close_good_decks";
const DEBUG = false;

function debug_write(text)
{
    if (!DEBUG)
    {
        return;
    }

    let page = browser.extension.getBackgroundPage();
    page.add_debug_output_line(text);

    display_debug_write();
}

function display_debug_write()
{
    if (!DEBUG)
    {
        return;
    }

    let page = browser.extension.getBackgroundPage();
    let lines = page.get_debug_output_lines();

    let debug_div = document.getElementById("debug-output");
    
    while(debug_div.hasChildNodes())
    {
        debug_div.removeChild(debug_div.lastChild);
    }

    for (line of lines)
    {
        let nextLineDiv = document.createElement("div");
        let nextLineText = document.createTextNode(line);
        nextLineDiv.appendChild(nextLineText);
        debug_div.appendChild(nextLineDiv);
    }
}

async function getRootFolderId()
{
    let rootFolderId;
    let bookmarks = await browser.bookmarks.search(ROOT_FOLDER_TITLE)
    if (bookmarks.length === 0) {
        let folder = await browser.bookmarks.create({
            title: ROOT_FOLDER_TITLE
        });
        rootFolderId = folder.id;
    } else {
        rootFolderId = bookmarks[0].id;
    }
    return rootFolderId;
}

async function displayTabsListFromBookmarks()
{
    debug_write("in displayTabsListFromBookmarks...");

    let tabsRootDiv = document.getElementById("tabs-root");

    let saveWindowDiv = document.createElement("div");
    saveWindowText = document.createTextNode("Save Window...");
    saveWindowDiv.appendChild(saveWindowText);
    saveWindowDiv.classList.add("button");
    saveWindowDiv.addEventListener("click", () => { saveTabsToBookmarks() });
    tabsRootDiv.appendChild(saveWindowDiv);

    let rootFolderId = await getRootFolderId();
    let folders = await browser.bookmarks.getChildren(rootFolderId);

    for (folder of folders)
    {
        let bookmarks = await browser.bookmarks.getChildren(folder.id);

        let folderRootDiv = document.createElement("div");

        let sepHr = document.createElement("hr");
        folderRootDiv.appendChild(sepHr);

        let folderButtonDiv = document.createElement("div");
        folderButtonDiv.classList.add("button");
        
        folderButtonText = document.createTextNode("Load Tabs (" + bookmarks.length + ")...")
        folderButtonDiv.appendChild(folderButtonText);

        // TODO does this get removed when reset, or does it leak?...
        let folderId = folder.id;
        folderButtonDiv.addEventListener("click", () => {loadTabsFromBookmarks(folderId)});
        
        let folderAddDiv = document.createElement("div");
        folderAddDiv.classList.add("button");
        folderAddText = document.createTextNode("Add Current Tab to set...");
        folderAddDiv.appendChild(folderAddText);

        folderAddDiv.addEventListener("click", () => {addTabToSet(folderId)});

        folderRootDiv.appendChild(folderButtonDiv);
        folderRootDiv.appendChild(folderAddDiv);

        tabsRootDiv.appendChild(folderRootDiv);
    }
}

async function saveTabsToBookmarks()
{
    let current_window = await browser.windows.getCurrent({populate: true});

    let rootFolderId = await getRootFolderId();

    // create a bookmark folder for this window
    let folder = await browser.bookmarks.create({
        // index: 0, // sort newest first
        parentId: rootFolderId,
        title: Date.now().toString(),
    });

    // save the tabs as bookmarks
    for (tab of current_window.tabs)
    {
        await browser.bookmarks.create({
            parentId: folder.id,
            title: tab.title,
            url: tab.url,
        });
    }

    // close the saved window
    await browser.windows.remove(current_window.id);
}

async function addTabToSet(folderId)
{
    debug_write("in addTabToSet, folderId: " + folderId);
    let activeTabs = await browser.tabs.query({currentWindow: true, active: true});
    let tab = activeTabs[0];
    await browser.bookmarks.create({
        parentId: folderId,
        title: tab.title,
        url: tab.url,
    });
    await browser.tabs.remove(tab.id);
}

async function loadTabsFromBookmarks(folderId)
{
    debug_write("in loadTabsFromBookmarks: " + folderId);
    let bookmarks = await browser.bookmarks.getChildren(folderId);
    if (bookmarks.length === 0)
    {
        return;
    }

    let urls = bookmarks.map(bookmark => bookmark.url)

    let page = browser.extension.getBackgroundPage();
    await page.add_tabs_to_load(urls);
    display_debug_write();
}

displayTabsListFromBookmarks();
display_debug_write();