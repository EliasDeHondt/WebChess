/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2025
 */

// Content Loader
function loadExternalContent(DivId, url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById(DivId).innerHTML = data;
        });
}