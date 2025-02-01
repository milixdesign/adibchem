
document.addEventListener("DOMContentLoaded", function () {

    const MIN_LOADER_TIME = 800; // Minimum time for the loader to be displayed (ms)
    const loaderOverlay = document.getElementById("loader-overlay");
    //const pageName = "home"; // The key for this page in translations.json

    const languages = [
        { code: "fa", name: "فارسی", direction: "rtl" },
        { code: "en", name: "English", direction: "ltr" },
        { code: "ar", name: "العربية", direction: "rtl" },
        { code: "tr", name: "Türkçe", direction: "ltr" }
    ];

    const dropdownLinks = document.querySelectorAll(".dropdown-link");
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const dropdownList = document.querySelector(".dropdown-list");

    let translations = {};

    // Function to fetch translations
    async function fetchTranslations() {
        try {
            const response = await fetch('/translations.json');
            translations = await response.json();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    // Function to dynamically detect and update the page name from the URL
    function updatePageNameFromURL() {
        const pathSegments = window.location.pathname.split("/").filter(Boolean);
        const supportedPages = ["home", "about", "products", "contact"];
        let page = "home"; // Default page

        if (pathSegments.length === 0) {
            page = "home";
        } else {
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (supportedPages.includes(lastSegment)) {
                page = lastSegment;
            } else {
                page = "home"; // Fallback to home if page is not recognized
            }
        }

        return page;
    }

    // Update the pageName variable dynamically
    let pageName = updatePageNameFromURL();
    console.log("Page name:", pageName);


    // Function to get language code from URL
    function getLangCodeFromURL() {
        const pathSegments = window.location.pathname.split("/").filter(Boolean);
        if (pathSegments.length === 0) return "fa"; // Default language
        const firstSegment = pathSegments[0];
        const lang = languages.find(lang => lang.code === firstSegment);
        return lang ? lang.code : "fa"; // Default to 'fa' if no valid language code found
    }

    // Function to update the URL based on the selected language
    function updateUrlForLanguage(langCode) {
        const pathSegments = window.location.pathname.split("/").filter(Boolean);

        // Remove existing language prefix if it's not the new one
        if (pathSegments.length > 0 && languages.some(lang => lang.code === pathSegments[0])) {
            pathSegments.shift();
        }

        // Add the new language prefix unless it's the default language (fa)
        if (langCode !== "fa") {
            pathSegments.unshift(langCode);
        }

        const newPath = "/" + pathSegments.join("/");
        window.history.replaceState({}, "", newPath);
    }

    // Function to rewrite internal links based on the selected language
    function rewriteLinksForLanguage(langCode) {
        document.querySelectorAll('a[href^="/"]').forEach(anchor => {
            let href = anchor.getAttribute("href");
            if (!href) return;

            // Handle root link
            if (href === "/") {
                anchor.setAttribute("href", langCode === "fa" ? "/" : `/${langCode}`);
                return;
            }

            // Remove existing language prefix and .html
            href = href.replace(/^\/(en|ar|tr)\//, '/').replace(/\.html$/, '');

            // Add language prefix if not Persian
            if (langCode !== "fa") {
                href = `/${langCode}${href.startsWith('/') ? href : '/' + href}`;
            }

            anchor.setAttribute("href", href);
        });
    }

    // Function to apply translations based on the selected language
    function applyTranslations(languageCode) {
        const pageData = translations[languageCode][pageName];
        if (pageData) {
            // Update Page title
            document.title = pageData.pageTitle || document.title;
            // Update Meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc && pageData.pageDescription) {
                metaDesc.setAttribute("content", pageData.pageDescription);
            }

            // Update text content
            document.querySelectorAll("[data-i18n]").forEach(element => {
                const key = element.getAttribute("data-i18n");
                if (pageData[key]) {
                    element.textContent = pageData[key];
                }
            });
        }

        // Update the language title in the dropdown
        const languageTitle = document.querySelector(".language-title");
        const currentLanguage = languages.find(lang => lang.code === languageCode);
        if (languageTitle && currentLanguage) {
            languageTitle.textContent = currentLanguage.name;
        }
    }

    // Function to show the loader
    function showLoader() {
        loaderOverlay.classList.remove("hide");
    }

    // Function to hide the loader
    function hideLoader() {
        loaderOverlay.classList.add("hide");
    }

    // Function to initialize the page based on URL
    async function initializePage() {
        await fetchTranslations();
        const storedLanguage = localStorage.getItem("selectedLanguage") || "fa";
        const urlLanguage = getLangCodeFromURL();

        const finalLanguage = languages.find(lang => lang.code === urlLanguage) ? urlLanguage : storedLanguage;
        console.log("Final language:", finalLanguage);

        // Set language attributes
        const selectedLanguage = languages.find(lang => lang.code === finalLanguage) || languages[0];
        document.documentElement.setAttribute("dir", selectedLanguage.direction);
        document.documentElement.setAttribute("lang", selectedLanguage.code);
        localStorage.setItem("selectedLanguage", selectedLanguage.code);

        // Update URL if it doesn't match the language
        if (urlLanguage !== finalLanguage) {
            updateUrlForLanguage(finalLanguage);
        }

        // Rewrite internal links
        rewriteLinksForLanguage(finalLanguage);

        // Apply translations
        showLoader();
        const loaderStart = Date.now();
        applyTranslations(finalLanguage);

        // Ensure loader is visible for minimum time
        const elapsed = Date.now() - loaderStart;
        const remaining = Math.max(0, MIN_LOADER_TIME - elapsed);
        setTimeout(hideLoader, remaining);
    }

    // Handle language switches
    dropdownLinks.forEach(link => {
        link.addEventListener("click", async (e) => {
            e.preventDefault();

            showLoader();
            const loaderStart = Date.now();
    
            // Ensure loader is visible for minimum time
            const elapsed = Date.now() - loaderStart;
            const remaining = Math.max(0, MIN_LOADER_TIME - elapsed);
            setTimeout(hideLoader, remaining);

            const selectedLanguageName = e.target.textContent.trim();
            const language = languages.find(lang => lang.name === selectedLanguageName);
            if (!language) return;

            const previousLanguage = localStorage.getItem("selectedLanguage") || "fa";

            if (language.code === previousLanguage) {
                // No change needed
                dropdownList.classList.remove("w--open");
                return;
            }

            // Set direction and language attributes
            document.documentElement.setAttribute("dir", language.direction);
            document.documentElement.setAttribute("lang", language.code);
            // Store language preference
            localStorage.setItem("selectedLanguage", language.code);
            // Close the dropdown
            dropdownList.classList.remove("w--open");

            // Update URL
            updateUrlForLanguage(language.code);
            // Rewrite internal links
            rewriteLinksForLanguage(language.code);
            // Apply translations
            applyTranslations(language.code);
            
            location.reload();
            

        });
    });

    // Toggle dropdown menu
    dropdownToggle.addEventListener("click", function () {
        dropdownList.classList.toggle("w--open");
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", function (event) {
        if (!dropdownToggle.contains(event.target)) {
            dropdownList.classList.remove("w--open");
        }
    });

    // Initialize the page
    initializePage();
});
