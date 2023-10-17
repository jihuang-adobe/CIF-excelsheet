'use strict';

const fetch = require('node-fetch');

async function getRemoteJSON(remoteJSONURL) {
    const res = await fetch(remoteJSONURL);

    if (!res.ok) {
        return null;
    }

    const content = res.headers.get('Content-Type').match(/html/i) ? await res.text() : await res.json();

    return content;
}

async function getSubcategories(remoteJSONURL, categoryId) {
    const res = await fetch(remoteJSONURL);

    if (!res.ok) {
      return null;
    }
  
    const content = res.headers.get("Content-Type").match(/html/i)
      ? await res.text()
      : await res.json();
  
    let subCategories = [];
  
    if (!content) {
      return subCategories;
    }

    const filteredResults = content.data.filter((row) =>
        row.parent_category_id.includes(categoryId)
    );
  
    subCategories = filteredResults.map((row) => row.category_uid);
  
    // remove dup
    return subCategories.filter(function (subCategory, index, self) {
      return self.indexOf(subCategory) == index;
    });
}

module.exports = {
    getRemoteJSON,
    getSubcategories
};
