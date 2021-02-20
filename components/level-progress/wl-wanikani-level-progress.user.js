/*************************************************
 *  ANCHOR Component initialisation
 *************************************************/
function initialiseLevelProgressComponent() {
    // NOTE Get level progress data and generate HTML for section
    let levelProgressData = getLevelProgress(wkofItemsData.AllData);
    let levelProgressCircleHTML = generateLevelProgressCircleHTML(levelProgressData, 60, 6);
    let levelProgressKanjiInProgressHTML = generateCustomItemsHTML(levelProgressData.Kanji.InProgress);
    let levelProgressRadicalsInProgressHTML = generateCustomItemsHTML(levelProgressData.Radicals.InProgress);
    let levelProgressKanjiPassedHTML = generateCustomItemsHTML(levelProgressData.Kanji.Passed);
    let levelProgressRadicalsPassedHTML = generateCustomItemsHTML(levelProgressData.Radicals.Passed);
    let levelProgressKanjiLockedHTML = generateCustomItemsHTML(levelProgressData.Kanji.Locked, 'locked');
    let levelProgressItemsHTML = `
        ${ levelProgressCircleHTML }
        <div class="progress-entries custom-div border-bottom kanji-in-progress ${ levelProgressKanjiInProgressHTML == '' ? 'all-done' : '' }">
            <h2 class="progress-entry-header text-sm text-black text-left leading-none tracking-normal font-bold">漢字進行中</h2>
            ${ levelProgressKanjiInProgressHTML }
        </div>
        <div class="progress-entries custom-div border-bottom radicals-in-progress ${ levelProgressRadicalsInProgressHTML == '' ? 'all-done' : '' }">
            <h2 class="progress-entry-header text-sm text-black text-left leading-none tracking-normal font-bold">部首進行中</h2>
            ${ levelProgressRadicalsInProgressHTML }
        </div>
        <div class="progress-entries custom-div border-bottom kanji-passed ${ levelProgressKanjiPassedHTML == '' ? 'all-done' : '' }">
            <h2 class="progress-entry-header text-sm text-black text-left leading-none tracking-normal font-bold">漢字合格</h2>
            ${ levelProgressKanjiPassedHTML }
        </div>
        <div class="progress-entries custom-div border-bottom radicals-passed ${ levelProgressRadicalsPassedHTML == '' ? 'all-done' : '' }">
            <h2 class="progress-entry-header text-sm text-black text-left leading-none tracking-normal font-bold">部首合格</h2>
            ${ levelProgressRadicalsPassedHTML }
        </div>
        <div class="progress-entries custom-div kanji-locked ${ levelProgressKanjiLockedHTML == '' ? 'all-done' : '' }">
            <h2 class="progress-entry-header text-sm text-black text-left leading-none tracking-normal font-bold">漢字ロック</h2>
            ${ levelProgressKanjiLockedHTML }
        </div>
    `;
    let levelProgressItemsTableHTML = generateCustomItemsTableHTML(levelProgressData, 'custom-dashboard-progress-items', 'レベルすすむ', levelProgressItemsHTML);

    $(levelProgressItemsTableHTML).insertAfter(customLessonsAndReviewsElement);

    setLevelProgressCircle((levelProgressData.Kanji.Passed.length / levelProgressData.KanjiToPass) * 100);
}


/*************************************************
 *  ANCHOR Level progress circle HTML generator
 *************************************************/
function generateLevelProgressCircleHTML(data, size, thickness) {
    let levelProgressCircleHTML = `
        <div class="level-progress-indicator">
            <span>${ data.Kanji.Passed.length } / ${ data.KanjiToPass }</span>
            <svg
            class="progress-ring"
            width="${ size }"
            height="${ size }">
                <circle
                    class="progress-ring-circle-track"
                    stroke-width="${ thickness }"
                    fill="transparent"
                    r="${ (size / 2) - thickness }"
                    cx="${ size / 2 }"
                    cy="${ size / 2 }"/>
                <circle
                    class="progress-ring-circle"
                    stroke-width="${ thickness }"
                    fill="transparent"
                    r="${ (size / 2) - thickness }"
                    cx="${ size / 2 }"
                    cy="${ size / 2 }"/>
            </svg>
        </div>
    `;

    return levelProgressCircleHTML;
};


/*************************************************
 *  ANCHOR Set level progress indicator fill
 *************************************************/
function setLevelProgressCircle(percent) {
    let circle = $('.level-progress-indicator .progress-ring circle.progress-ring-circle');
    let circleObj = circle[0];
    let radius = circleObj.r.baseVal.value;
    let circumference = radius * 2 * Math.PI;

    circleObj.style.strokeDasharray = `${circumference} ${circumference}`;
    circleObj.style.strokeDashoffset = `${circumference}`;

    const offset = circumference - percent / 100 * circumference;
    circleObj.style.strokeDashoffset = offset;
    wlWanikaniDebug('Circle object.', circleObj);
};


/*************************************************
 *  ANCHOR Generate level progress data object
 *************************************************/
function getLevelProgress(data) {
    wlWanikaniDebug('Getting level progress data.');

    let progressData = {
        Kanji: {
            InProgress: new Array(),
            Passed: new Array(),
            Locked: new Array()
        },
        Radicals: {
            InProgress: new Array(),
            Passed: new Array()
        }
    };

    // NOTE Level Progress data assignment
    $.each(data.ItemsData, function(index, item) {
        if (item.data.level == data.UsersData.data.level) {
            if (item.object == 'kanji') {
                if ("assignments" in item) {
                    if (item.assignments.passed_at == null && item.assignments.unlocked_at != null) {
                        progressData.Kanji.InProgress.push(item);
                    }
                    else if (item.assignments.passed_at != null) {
                        progressData.Kanji.Passed.push(item);
                    }
                }
                else {
                    progressData.Kanji.Locked.push(item);
                }
            }
            else if (item.object == 'radical') {
                if ("assignments" in item) {
                    if (item.assignments.passed_at == null && item.assignments.unlocked_at != null) {
                        progressData.Radicals.InProgress.push(item);
                    }
                    else if (item.assignments.passed_at != null) {
                        progressData.Radicals.Passed.push(item);
                    }
                }
            }
        }
    });

    // NOTE Sorting items by SRS level
    progressData.Kanji.InProgress = (progressData.Kanji.InProgress.length > 0) ? itemLevelSort(progressData.Kanji.InProgress) : [];
    progressData.Kanji.Passed = (progressData.Kanji.Passed.length > 0) ? itemLevelSort(progressData.Kanji.Passed) : [];
    progressData.Radicals.InProgress = (progressData.Radicals.InProgress.length > 0) ? itemLevelSort(progressData.Radicals.InProgress) : [];
    progressData.Radicals.Passed = (progressData.Radicals.Passed.length > 0) ? itemLevelSort(progressData.Radicals.Passed) : [];

    // NOTE Calculation for how many kanji are needed to pass the level
    progressData.KanjiToPass = Math.ceil(
        (progressData.Kanji.InProgress.length + progressData.Kanji.Passed.length + progressData.Kanji.Locked.length)
        * 0.9);

    wlWanikaniDebug('Level progress data.', progressData);
    return progressData;
};