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

async function getAllCategoryIds(remoteJSONURL) {
    const res = await fetch(remoteJSONURL);

    if (!res.ok) {
        return null;
    }

    const content = res.headers.get('Content-Type').match(/html/i) ? await res.text() : await res.json();
    
    let categoryIds = [];
    let categories = null;

    if(!content) {
        return categories;
    }

    categories = content.data.filter((row) =>
        row.category_id
    );

    categories.forEach((currentCategory) => { 
        if(!categoryIds.includes(currentCategory.category_uid)) {
            categoryIds.push(currentCategory.category_uid);
        }
    });

    return categoryIds;
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
  
    return subCategories.filter(function (subCategory, index, self) {
      return self.indexOf(subCategory) == index;
    });
}

module.exports = {
    getRemoteJSON,
    getSubcategories,
    getAllCategoryIds
};
