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
    debug_div.innerHTML = "";

    for (line of lines)
    {
        let nextLineDiv = document.createElement("div");
        let nextLineText = document.createTextNode(line);
        nextLineDiv.appendChild(nextLineText);
        debug_div.appendChild(nextLineDiv);
    }
}

class SavedTab
{
    constructor(url, title) {
        this.url = url;
        this.title = title;
    }

    containsText(text) {
        return this.url.toLowerCase().indexOf(text) !== -1 || this.title.toLowerCase().indexOf(text) !== -1;
    }

    createHTML() {
        let tabLi = document.createElement("li");
        tabLi.classList.add("tablistitem");
        
        let a = document.createElement("a");
        a.href = this.url;
        a.classList.add("tabitem");
        a.innerHTML = this.title;

        tabLi.appendChild(a);

        return tabLi;
    }

}

class SavedWindow
{
    constructor(folderId, position) {
        this.folderId = folderId;
        this.position = position;
        this.savedTabs = [];
    }

    async loadFromBookmarks() {
        let bookmarks = await browser.bookmarks.getChildren(this.folderId);

        for (let bookmark of bookmarks)
        {
            let savedTab = new SavedTab(bookmark.url, bookmark.title);
            this.savedTabs.push(savedTab);
        }
    }

    async containsText(text) {
        if (this.savedTabs.length === 0) {
            await this.loadFromBookmarks();
        }

        for (let tab of this.savedTabs) {
            if (tab.containsText(text)) {
                return true;
            }
        }
        return false;
    }

    async loadTabsInNewWindow() {
        // remove bookmarks
        await browser.bookmarks.removeTree(this.folderId);

        // load new window with tabs
        let urls = this.savedTabs.map(savedTab => savedTab.url);
        await browser.windows.create({url: urls});
    }

    async createHTML() {
        if (this.savedTabs.length === 0) {
            await this.loadFromBookmarks();
        }

        let folderRootDiv = document.createElement("div");

        let sepHr = document.createElement("hr");
        folderRootDiv.appendChild(sepHr);

        let folderButtonDiv = document.createElement("div");
        folderButtonDiv.classList.add("button");
        folderButtonDiv.innerHTML = "Load Tabs...";
        folderButtonDiv.addEventListener("click", () => {this.loadTabsInNewWindow()})
        folderRootDiv.appendChild(folderButtonDiv);

        let folderUl = document.createElement("ul");
        folderUl.classList.add("tablist")
        folderRootDiv.appendChild(folderUl);

        for (let savedTab of this.savedTabs)
        {
            let tabLi = savedTab.createHTML();
            folderUl.appendChild(tabLi);
        }

        return folderRootDiv;
    }
}

class SavedWindowsList
{
    constructor() {
        this.savedWindows = [];
        this.num_to_display = 0;
        this.direction = 1;
        this.searchText = "";

        this.loading = false;

        let rootDiv = document.getElementById("root");

        let saveWindowDiv = document.createElement("div");
        this.saveWindowDiv = saveWindowDiv;
        saveWindowDiv.innerHTML = "Save Window...";
        saveWindowDiv.classList.add("button");
        saveWindowDiv.addEventListener("click", () => { this.saveTabsToBookmarks() });
        rootDiv.appendChild(saveWindowDiv);

        let toggleSortDiv = document.createElement("div");
        this.toggleSortDiv = toggleSortDiv;
        toggleSortDiv.innerHTML = "Toggle Sort Direction...";
        toggleSortDiv.classList.add("button");
        toggleSortDiv.addEventListener("click", () => { this.toggleSortDirection() });
        rootDiv.appendChild(toggleSortDiv);

        let searchInput = document.createElement("input");
        this.searchInput = searchInput;
        searchInput.type = "text"
        searchInput.addEventListener("input", (event) => { this.onSearchTextChange(event) });
        rootDiv.appendChild(searchInput);

        let tabsRootDiv = document.createElement("div");
        tabsRootDiv.id = "tabs-root";
        rootDiv.appendChild(tabsRootDiv);
    }

    async getRootFolderId()
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

    enableInput() {
        this.saveWindowDiv.style.pointerEvents = "auto";
        this.saveWindowDiv.classList.remove("disableinput");
        this.toggleSortDiv.style.pointerEvents = "auto";
        this.toggleSortDiv.classList.remove("disableinput");
        this.searchInput.style.pointerEvents = "auto";
        this.searchInput.classList.remove("disableinput");
        this.searchInput.readOnly = false;
    }

    disableInput() {
        this.saveWindowDiv.style.pointerEvents = "none";
        this.saveWindowDiv.classList.add("disableinput");
        this.toggleSortDiv.style.pointerEvents = "none";
        this.toggleSortDiv.classList.add("disableinput");
        this.searchInput.style.pointerEvents = "none";
        this.searchInput.classList.add("disableinput");
        this.searchInput.readOnly = true;
    }

    async loadFromBookmarks() {
        this.disableInput();

        let rootFolderId = await this.getRootFolderId();
        let folders = await browser.bookmarks.getChildren(rootFolderId);

        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            let savedWindow = new SavedWindow(folder.id, i);
            this.savedWindows.push(savedWindow);
        }

        await this.displayMoreSavedWindows();

        this.enableInput();
    }

    async displayMoreSavedWindows() {
        this.num_to_display = Math.min(this.num_to_display + 10, this.savedWindows.length);
        await this.createHTML();
    }

    async saveTabsToBookmarks()
    {
        this.disableInput();

        let current_window = await browser.windows.getCurrent({populate: true});

        let rootFolderId = await this.getRootFolderId();

        // create a bookmark folder for this window
        let folder = await browser.bookmarks.create({
            index: 0, // sort newest first
            parentId: rootFolderId,
            title: Date.now().toString(),
        });

        // save the tabs as bookmarks
        for (let tab of current_window.tabs)
        {
            await browser.bookmarks.create({
                parentId: folder.id,
                title: tab.title,
                url: tab.url,
            });
        }

        // this.enableInput();

        // close the saved window
        await browser.windows.remove(current_window.id);
    }

    async toggleSortDirection() {
        this.disableInput();

        this.direction *= -1;
        this.savedWindows.sort((a, b) => this.direction * (a.position - b.position) );

        this.num_to_display = 0;
        await this.displayMoreSavedWindows();
        this.enableInput();
    }

    async onSearchTextChange(event) {
        this.disableInput();
        if (this.searchText !== event.target.value) {
            this.searchText = event.target.value;
            this.num_to_display = 0;
            await this.displayMoreSavedWindows();
        }
        this.enableInput();
    }

    async createHTML() {
        if (this.loading) {
            setTimeout(this.createHTML, 1000);
            return;
        }

        this.loading = true;

        let tabsRootDiv = document.getElementById("tabs-root");
        tabsRootDiv.innerHTML = "";        

        let showLoadMoreButton = true;
        let numSWRem = 0;

        let textLower = this.searchText.toLowerCase();
        for (let i = 0, j = 0; i < this.savedWindows.length && j < this.num_to_display; i++)
        {
            const savedWindow = this.savedWindows[i];
            if (textLower == "" || await savedWindow.containsText(textLower)) {
                j++;
                numSWRem = this.savedWindows.length - i - 1;
                let folderRootDiv = await savedWindow.createHTML();
                tabsRootDiv.appendChild(folderRootDiv);
            }

            if (i === this.savedWindows.length - 1) {
                showLoadMoreButton = false;
            }
        }

        if (showLoadMoreButton) {
            let sepHr = document.createElement("hr");
            tabsRootDiv.appendChild(sepHr);

            let loadMoreDiv = document.createElement("div");
            loadMoreDiv.innerHTML = "Load More Saved Windows (" + numSWRem + ")...";
            loadMoreDiv.classList.add("button");
            loadMoreDiv.addEventListener("click", () => { this.displayMoreSavedWindows() });
            tabsRootDiv.appendChild(loadMoreDiv);
        }

        if (this.num_to_display > 10) {
            let scrollDiv = tabsRootDiv.parentElement.parentElement;
            scrollDiv.scroll(0, scrollDiv.scrollHeight);
        }

        this.loading = false;
    }
}

let savedWindowsList = new SavedWindowsList();
savedWindowsList.loadFromBookmarks();

display_debug_write();