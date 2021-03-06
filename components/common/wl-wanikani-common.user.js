/*************************************************
 *  ANCHOR Variable initialisation
 *************************************************/
// NOTE Used for specific filtering configurations
const wanikaniSrsStages = {
    'locked': {'locked': -1 },
    'initiate': { 'initiate': 0 },
    'apprentice': {
        'apprentice1': 1,
        'apprentice2': 2,
        'apprentice3': 3,
        'apprentice4': 4
    },
    'guru': {
        'guru1': 5,
        'guru2': 6
    },
    'master': { 'master': 7 },
    'enlightened': { 'enlightened': 8 },
    'burned': { 'burned': 9 }
};


/*************************************************
 *  ANCHOR Item filters and sorting
 *************************************************/
// NOTE Sorts items based on item level
function itemLevelSort(itemsToSort) {
    return itemsToSort.sort((a, b) => {
        return (a.data.level == b.data.level)
             ? a.assignments.srs_stage - b.assignments.srs_stage
             : a.data.level - b.data.level;
    });
};


/*************************************************
 *  ANCHOR Get appropriate image or slug for a kanji/radical/vocabulary
 *  item provided
 *************************************************/
function itemsCharacterCallback (item){
    let itemsData = item.data;

    if (itemsData.characters != null) {
        return itemsData.characters;
    }
    else if (itemsData.character_images != null){
        return `<img class="radical-image" alt="${ itemsData.slug }" src="https://cdn.wanikani.com/subjects/images/${ item.id }-${ itemsData.slug }-original.png" data-dark-url="${ itemsData.character_images[0].url }"/>`;
    }
    else {
        return itemsData.slug;
    }
};


/*************************************************
 *  ANCHOR Kanji/radical/vocabulary item meaning or reading filters
 *************************************************/
function isAccepted(item) {
    return item.accepted_answer == true;
};

function isNotAccepted(item) {
    return item.accepted_answer == false;
};


/*************************************************
 *  ANCHOR Generate kanji/radical/vocabulary subject data object
 *************************************************/
function getSubjectData(data, type, subjectIds = []) {
    wlWanikaniDebug('data', '==Common: getSubjectData== Retrieving ' + type + ' subject data, using the following subject ids (if any, otherwise using all data):', subjectIds);

    let returnData = {
        kanji: new Array(),
        radical: new Array(),
        vocabulary: new Array()
    };
    let isLessonOrReview = false;
    let counter = 0;

    if (type == 'lesson') {
        isLessonOrReview = true;
        subjectIds = data.SummaryData.data.lessons[0].subject_ids;
    }
    else if (type == 'review') {
        isLessonOrReview = true;
        subjectIds = data.SummaryData.data.reviews[0].subject_ids;
    }
    else if (type == 'next-review') {
        isLessonOrReview = true;
    }

    $.each(data.ItemsData, (index, dataItem) => {
        if (isLessonOrReview) {
            if (Object.values(subjectIds).includes(dataItem.id)) {
                returnData[dataItem.object].push(dataItem);
                counter++;
            }
        }
        else {
            if ("assignments" in dataItem) {
                if (type == 'total') {
                    returnData[dataItem.object].push(dataItem);
                    counter++;
                }
                else {
                    if (Object.values(wanikaniSrsStages[type]).includes(dataItem.assignments.srs_stage)) {
                        returnData[dataItem.object].push(dataItem);
                        counter++;
                    }
                }
            }
        }
    })

    returnData.totalCount = counter;
    returnData.length = returnData.kanji.length + returnData.radical.length + returnData.vocabulary.length;
    returnData.kanji = (returnData.kanji.length > 0) ? itemLevelSort(returnData.kanji) : [];
    returnData.radical = (returnData.radical.length > 0) ? itemLevelSort(returnData.radical) : [];
    returnData.vocabulary = (returnData.vocabulary.length > 0) ? itemLevelSort(returnData.vocabulary) : [];

    wlWanikaniDebug('data', '==Common: getSubjectData== Retrieved ' + type + ' subject data:', returnData);
    return returnData;
};


/*************************************************
 *  ANCHOR Custom item table HTML generator
 *************************************************/
function generateCustomItemsTableHTML(customItemsData, customClass, headerMessageText, headerTypeHoverText, customItemsHTML, headerCount = false) {
    wlWanikaniDebug('data', '==Common: generateCustomItemsTableHTML== Generating custom items table (' + customClass + ') HTML with the following data:', customItemsData);

    let headerMessageCount = headerCount ? '（' + customItemsData.length + '）' : '';
    let headerMessage = (customItemsData.length == 0)
                        ? translationText.phrases.have_no_items.jp_kanji.replace('__', headerMessageText)
                        : translationText.phrases.have_items.jp_kanji.replace('__', headerMessageText) + headerMessageCount;
    let headerHoverText = (customItemsData.length == 0)
                        ? getHoverTitle(translationText.phrases.have_no_items, '', true, headerTypeHoverText)
                        : getHoverTitle(translationText.phrases.have_items, headerMessageCount, true, headerTypeHoverText);

    let customTableHTML = `
        <div class="rounded ${ customClass } custom-items ${ customItemsHTML == '' ? 'all-done' : '' }">
            <section class="rounded p-3 -mx-3">
                <h2 class="border-gray-100 border-solid border-0 border-b text-sm text-left leading-none tracking-normal font-bold mt-0 pb-2 mb-2"${ headerHoverText }>${ headerMessage }</h2>
                <div class="progress-entries">
                    ${ customItemsHTML }
                </div>
            </section>
        </div>
    `;

    wlWanikaniDebug('html', '==Common: generateCustomItemsTableHTML== Finished generating custom items (' + customClass + ') table HTML:', { main_html: customTableHTML });
    return customTableHTML;
};


/*************************************************
 *  ANCHOR Custom items HTML generator
 *************************************************/
function generateCustomItemsHTML(items, type) {
    wlWanikaniDebug('data', '==Common: generateCustomItemsHTML== Generating custom items (' + type + ') HTML with the following data:', items);

    let customItemsHTML = '';

    if (items.length > 0) {
        $.each(items, (index, item) => {
            let itemSrsLevel = '';
            let itemType = item.object;
            let customItemTooltipHTML = generateItemTooltipHTML(item);

            if ('assignments' in item) {
                let upcomingClass = '';
                
                if ('upcoming' in item) {
                    upcomingClass = item.upcoming ? ' is-upcoming' : '';
                }

                itemSrsLevel = `
                    <span class="progress-item-srs-level srs-level-${ item.assignments.srs_stage }${ upcomingClass }">
                        ${ item.assignments.srs_stage }
                    </span>
                `;
            }

            customItemsHTML += `
                    <div class="custom-item-tooltip progress-entry relative rounded-tr rounded-tl ${ itemType }">
                        ${ customItemTooltipHTML }
                        <a href="${ item.data.document_url }" class="${ itemType }-icon check-text-colour ${ type == 'kanji-locked' ? 'locked' : '' }" lang="ja">
                            <div>${ itemsCharacterCallback(item) }</div>
                            <span class="progress-item-level">${ item.data.level }</span>
                            ${ itemSrsLevel }
                        </a>
                    </div>
            `;
        });
    }

    wlWanikaniDebug('html', '==Common: generateCustomItemsHTML== Generated the following custom items (' + type + ') HTML:', { main_html: customItemsHTML });
    return customItemsHTML;
};


/*************************************************
 *  ANCHOR Custom item tooltip wrapper HTML generator
 *************************************************/
function generateItemTooltipHTML(item) {
    let tooltipTextHTML = '';
    let acceptedItemReadings = item.object != 'radical' ? item.data.readings.filter(isAccepted) : {};
    let acceptedItemMeanings = item.data.meanings.filter(isAccepted);
    let notAcceptedItemReadings = item.object != 'radical' ? item.data.readings.filter(isNotAccepted) : {};
    let notAcceptedItemMeanings = item.data.meanings.filter(isNotAccepted);

    if (acceptedItemReadings.length > 0 || acceptedItemMeanings.length > 0 || notAcceptedItemReadings.length > 0 || notAcceptedItemMeanings.length > 0) {
        tooltipTextHTML += `
            <span class="custom-item-tooltip-text">
        `;

        tooltipTextHTML += generateTooltipMeaningReadingHTML(acceptedItemReadings, acceptedItemMeanings, 'accepted');
        tooltipTextHTML += generateTooltipMeaningReadingHTML(notAcceptedItemReadings, notAcceptedItemMeanings, 'not-accepted');

        tooltipTextHTML += `
            </span>
        `;
    }

    return tooltipTextHTML;
};


/*************************************************
 *  ANCHOR Custom item tooltip content HTML generator
 *************************************************/
function generateTooltipMeaningReadingHTML(itemReadings, itemMeanings, customClass) {
    let returnTooltipTextHTML = '';
    let itemReadingOnyomiTooltipItems = '';
    let itemReadingKunyomiTooltipItems = '';
    let itemReadingNanoriTooltipItems = '';
    let itemReadingOtherTooltipItems = '';
    let itemMeaningTooltipItems = '';

    if (itemReadings.length > 0 || itemMeanings.length > 0) {
        returnTooltipTextHTML += `
            <div class="custom-item-tooltip-text-${ customClass }-entries">
        `;

        if (itemReadings.length > 0) {
            let onyomiReadings = itemReadings.filter((item) => { return item.type == 'onyomi'; });
            let kunyomiReadings = itemReadings.filter((item) => { return item.type == 'kunyomi'; });
            let nanoriReadings = itemReadings.filter((item) => { return item.type == 'nanori'; });
            let otherReadings = itemReadings.filter((item) => { return !('type' in item); });

            $.each(onyomiReadings, (index, reading) => {
                itemReadingOnyomiTooltipItems += (index == 0 ? '' : ', ') + reading.reading;
            });

            $.each(kunyomiReadings, (index, reading) => {
                itemReadingKunyomiTooltipItems += (index == 0 ? '' : ', ') + reading.reading;
            });

            $.each(nanoriReadings, (index, reading) => {
                itemReadingNanoriTooltipItems += (index == 0 ? '' : ', ') + reading.reading;
            });

            $.each(otherReadings, (index, reading) => {
                itemReadingOtherTooltipItems += (index == 0 ? '' : ', ') + reading.reading;
            });

            if (itemReadingOnyomiTooltipItems != '') {
                returnTooltipTextHTML += `
                <div class="custom-item-tooltip-text-entries item-readings onyomi"${ getHoverTitle(translationText.words.onyomi) }>
                    ${ translationText.words.onyomi.jp_kanji }：${ itemReadingOnyomiTooltipItems }
                </div>
                `;
            }

            if (itemReadingKunyomiTooltipItems != '') {
                returnTooltipTextHTML += `
                <div class="custom-item-tooltip-text-entries item-readings kunyomi"${ getHoverTitle(translationText.words.kunyomi) }>
                    ${ translationText.words.kunyomi.jp_kanji }：${ itemReadingKunyomiTooltipItems }
                </div>
                `;
            }

            if (itemReadingNanoriTooltipItems != '') {
                returnTooltipTextHTML += `
                <div class="custom-item-tooltip-text-entries item-readings nanori"${ getHoverTitle(translationText.words.nanori) }>
                    ${ translationText.words.nanori.jp_kanji }：${ itemReadingNanoriTooltipItems }
                </div>
                `;
            }

            if (itemReadingOtherTooltipItems != '') {
                returnTooltipTextHTML += `
                <div class="custom-item-tooltip-text-entries item-readings vocabulary"${ getHoverTitle(translationText.words.vocabulary) }>
                    ${ translationText.words.vocabulary.jp_kanji }：${ itemReadingOtherTooltipItems }
                </div>
                `;
            }
        }

        if (itemMeanings.length > 0) {
            $.each(itemMeanings, (index, meaning) => {
                itemMeaningTooltipItems += (index == 0 ? '' : ', ') + meaning.meaning;
            });

            returnTooltipTextHTML += `
                <div class="custom-item-tooltip-text-entries item-meanings"${ getHoverTitle(translationText.words.meaning) }>
                    ${ translationText.words.meaning.jp_kanji }：${ itemMeaningTooltipItems }
                </div>
            `;
        }

        returnTooltipTextHTML += `
            </div>
        `;
    }

    return returnTooltipTextHTML;
};


/*************************************************
 *  ANCHOR Custom summary HTML generator
 *************************************************/
function generateSummaryHTML(summaryData, htmlClasses, divHeaderText, divHeaderHoverText, hasButton = false, buttonClasses = '', buttonText = '', buttonHoverText = '') {
    wlWanikaniDebug('data', '==Common: generateSummaryHTML== Generating summary (' + htmlClasses + ') with this data:', summaryData);

    let buttonHTML = hasButton
    ? `
            <a class="custom-button ${ buttonClasses }"${ getHoverTitle.apply(this, buttonHoverText) }>
                <span>${ buttonText }</span>
            </a>
    `
    : '';

    let summaryHTML = `
        <div class="custom-summary ${ htmlClasses } check-text-colour">
            <h2${ getHoverTitle.apply(this, divHeaderHoverText) }>${ divHeaderText }</h2>
            <span class="custom-summary-kanji"${ getHoverTitle(translationText.words.kanji, '（' + summaryData.kanji.length + '）') }>
                ${ translationText.words.kanji.jp_kanji }（${ summaryData.kanji.length }）
            </span>
            <span class="custom-summary-radical"${ getHoverTitle(translationText.words.radical, '（' + summaryData.radical.length + '）') }>
                ${ translationText.words.radical.jp_kanji }（${ summaryData.radical.length }）
            </span>
            <span class="custom-summary-vocabulary"${ getHoverTitle(translationText.words.vocabulary, '（' + summaryData.vocabulary.length + '）') }>
                ${ translationText.words.vocabulary.jp_kanji }（${ summaryData.vocabulary.length }）
            </span>
            ${ buttonHTML }
        </div>
    `;

    wlWanikaniDebug('html', '==Common: generateSummaryHTML== Generated the following summary (' + htmlClasses + ') HTML:', { main_html: summaryHTML });
    return summaryHTML;
};


/*************************************************
 *  ANCHOR Dynamically set white or black text colours
 *************************************************/
function setTextColour() {
    let setTextColourDebugData = new Array();

    $.each($('.check-text-colour'), (index, element) => {
        setTextColourDebugData.push(element);
        
        let textColour = getContrastYIQ($(element).css('background-color'));

        $(element).attr('style', 'color: ' + textColour + ' !important');

        if ($(element).has('img') && textColour == '#000000') {
            let imageElement = $(element).find('img');
            
            $(imageElement).attr('src', $(imageElement).attr('data-dark-url'));
        }
    });

    wlWanikaniDebug('data', '==Common: setTextColour== Updated the following elements:', setTextColourDebugData);
};

// NOTE Colour checker
function getContrastYIQ(colour){
    let rgbValues = colour.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    let yiq = ((rgbValues[1]*299)+(rgbValues[2]*587)+(rgbValues[3]*114))/1000;
    
    return (yiq >= 128) ? '#000000' : '#ffffff';
};