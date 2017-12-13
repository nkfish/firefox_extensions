const ROOT_FOLDER_TITLE = "edge_set_tabs_aside_clone";
const DEBUG = false;

//TODO add content script to capture screenshots

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
        let folderRootDiv = document.createElement("div");

        let sepHr = document.createElement("hr");
        folderRootDiv.appendChild(sepHr);

        let folderButtonDiv = document.createElement("div");
        folderButtonDiv.classList.add("button");
        
        folderButtonText = document.createTextNode("Load Tabs...")
        folderButtonDiv.appendChild(folderButtonText);

        // TODO does this get removed when reset, or does it leak?...
        let folderId = folder.id;
        folderButtonDiv.addEventListener("click", () => {loadTabsFromBookmarks(folderId)})

        folderRootDiv.appendChild(folderButtonDiv);

        let folderUl = document.createElement("ul");
        folderRootDiv.appendChild(folderUl);

        folderUl.classList.add("tablist")

        let bookmarks = await browser.bookmarks.getChildren(folder.id);
        for (bookmark of bookmarks)
        {
            tabLi = document.createElement("li");
            tabLi.classList.add("tablistitem");
            
            let a = document.createElement("a");
            a.href = bookmark.url;
            a.classList.add("tabitem");

            let textNode = document.createTextNode(bookmark.title);
            a.appendChild(textNode);
            tabLi.appendChild(a);

            folderUl.appendChild(tabLi);
        }

        tabsRootDiv.appendChild(folderRootDiv);
    }
}

async function saveTabsToBookmarks()
{
    let current_window = await browser.windows.getCurrent({populate: true});

    let rootFolderId = await getRootFolderId();

    // create a bookmark folder for this window
    let folder = await browser.bookmarks.create({
        index: 0, // sort newest first
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

async function loadTabsFromBookmarks(folderId)
{
    let bookmarks = await browser.bookmarks.getChildren(folderId);
    if (bookmarks.length === 0)
    {
        return;
    }

    // remove bookmarks
    await browser.bookmarks.removeTree(folderId);

    // load new window with tabs
    let urls = bookmarks.map(bookmark => bookmark.url)
    await browser.windows.create({url: urls});
}

displayTabsListFromBookmarks();
display_debug_write();