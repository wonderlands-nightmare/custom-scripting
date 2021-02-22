// ==UserScript==
// @name         WaniKani Custom Dashboard - DEV
// @namespace    https://github.com/wonderlands-nightmare
// @version      1.3.2.9
// @description  A collection of custom scripts for editing the wanikani experience.
// @author       Wonderland-Nightmares
// @include      /^https://(www|preview).wanikani.com/(dashboard)?$/
// @resource     WKOF_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/wkof/wl-wanikani-wkof.user.js
// @resource     WKOF_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/wkof/wl-wanikani-wkof.user.css
// @resource     THEME_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/custom-themes/wl-wanikani-custom-themes.user.js
// @resource     DEFAULT_THEME_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/custom-themes/wl-wanikani-custom-themes-default.user.css
// @resource     DARK_THEME_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/custom-themes/wl-wanikani-custom-themes-dark.user.css
// @resource     INIT_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/dashboard-initialiser/wl-wanikani-dashboard-initialiser.user.js
// @resource     INIT_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/dashboard-initialiser/wl-wanikani-dashboard-initialiser.user.css
// @resource     DEBUG_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/debug/wl-wanikani-debug.user.js
// @resource     COMMON_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/common/wl-wanikani-common.user.js
// @resource     COMMON_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/common/wl-wanikani-common.user.css
// @resource     MAIN_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/main-summary/wl-wanikani-main-summary.user.js
// @resource     MAIN_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/main-summary/wl-wanikani-main-summary.user.css
// @resource     LEVEL_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/level-progress/wl-wanikani-level-progress.user.js
// @resource     LEVEL_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/level-progress/wl-wanikani-level-progress.user.css
// @resource     SRS_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/srs-summary/wl-wanikani-srs-summary.user.js
// @resource     SRS_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/srs-summary/wl-wanikani-srs-summary.user.css
// @resource     DIFFICULT_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/difficult-items/wl-wanikani-difficult-items.user.js
// @resource     DIFFICULT_CSS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/difficult-items/wl-wanikani-difficult-items.user.css
// @resource     REFRESH_JS https://raw.githubusercontent.com/wonderlands-nightmare/custom-scripting/develop/components/auto-refresh/wl-wanikani-auto-refresh.user.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    /*************************************************
     *  ANCHOR Variable initialisation
     *************************************************/
    // Change this to turn debugging on
    const isDebug = false;

    // WKOF modules required
    const wkofSettingsModules = 'Menu, Settings';
    const wkofDataModules = 'Apiv2, ItemData';

    // Dashboard resources
    const dashboardResources = {
        wkof: {
            js: 'WKOF_JS',
            css: 'WKOF_CSS'
        },
        customTheme: {
            js: 'THEME_JS',
            1: { // Default theme
                css: 'DEFAULT_THEME_CSS'
            },
            2: { // Dark theme
                css: 'DARK_THEME_CSS'
            }
        },
        dashboardInitialiser: {
            js: 'INIT_JS',
            css: 'INIT_CSS'
        },
        debug: {
            js: 'DEBUG_JS',
            css: ''
        },
        common: {
            js: 'COMMON_JS',
            css: 'COMMON_CSS'
        },
        mainSummary: {
            js: 'MAIN_JS',
            css: 'MAIN_CSS'
        },
        levelProgress: {
            js: 'LEVEL_JS',
            css: 'LEVEL_CSS'
        },
        srsSummary: {
            js: 'SRS_JS',
            css: 'SRS_CSS'
        },
        difficultItems: {
            js: 'DIFFICULT_JS',
            css: 'DIFFICULT_CSS'
        },
        autoRefresh: {
            js: 'REFRESH_JS',
            css: ''
        }
    }
    

    /*************************************************
     *  ANCHOR Actual script execution code
     *************************************************/
    addResources(['wkof', 'dashboardInitialiser', 'debug', 'common']);
    wkofInstallCheck();
    initialiseDashboardInitialiserComponent();

    wkof.include(wkofSettingsModules);
    wkof.ready(wkofSettingsModules)
        .then(loadWkofMenu)
        .then(loadWkofSettings);
    
    wkof.include(wkofDataModules);
    wkof.ready(wkofDataModules)
        .then(getWkofDataObject)
        .then(function(data) {
            addResources(['customTheme', 'mainSummary', 'levelProgress', 'srsSummary', 'difficultItems', 'autoRefresh']);
            wkofItemsData.AllData = data;
            setCustomDashboardTheme();
        })
        .then(function() {
            setWlWanikaniDebugMode(isDebug);
            initialiseMainSummaryComponent();
            initialiseLevelProgressComponent();
            initialiseSrsSummaryComponent();
            initialiseDifficultItemsComponent();
            autoRefreshOnNextReviewHour(wkofItemsData.AllData.SummaryData);
            dashboardLoader(true);
        });


    /*************************************************
     *  ANCHOR Retrieves CSS and JS code through GM and adds to page
     *  Required to be in executor script due to GM functions
     *************************************************/
    function addResources(resourceNames) {
        $.each(resourceNames, function(index, resourceName) {
            const jsResource = dashboardResources[resourceName].js;
            let cssResource = '';

            // Add JS resource if specified
            if (jsResource != '') {
                const functionJs = GM_getResourceText(jsResource);

                let script = document.createElement('script');
                script.innerHTML = functionJs;
                script.type = 'text/javascript';
                script.className = 'custom-js';

                document.body.appendChild(script);
            }

            // Required for custom themes since GM is not available in other files
            if (resourceName == 'customTheme') {
                customThemeCss = {
                    1: GM_getResourceText(dashboardResources[resourceName][1].css),
                    2: GM_getResourceText(dashboardResources[resourceName][2].css)
                }
            }
            else {
                cssResource = dashboardResources[resourceName].css;
            }

            // Add CSS resource if specified
            if (cssResource != '') {
                const styleCss = GM_getResourceText(cssResource);
                
                if (resourceName == 'wkof') {
                    wcdDialogCss = styleCss;
                }
                else {
                    GM_addStyle(styleCss);
                }
            }
        });
    };
})();