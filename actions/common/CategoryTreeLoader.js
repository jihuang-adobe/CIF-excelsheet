/*******************************************************************************
 *
 *    Copyright 2019 Adobe. All rights reserved.
 *    This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License. You may obtain a copy
 *    of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software distributed under
 *    the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *    OF ANY KIND, either express or implied. See the License for the specific language
 *    governing permissions and limitations under the License.
 *
 ******************************************************************************/

'use strict';

const DataLoader = require('dataloader');

const {
    getRemoteJSON,
    getSubcategories
} = require('../services/remoteJSON.js');

class CategoryTreeLoader {
    /**
     * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
     */
    constructor(actionParameters) {
        // The loading function: "categoryIds" is an Array of category ids
        let loadingFunction = (categoryIds) => {
            // This loader loads each category one by one, but if the 3rd party backend allows it,
            // it could also fetch all categories in one single request. In this case, the method
            // must still return an Array of categories with the same order as the keys.
            return Promise.resolve(
                categoryIds.map((categoryId) => {
                    console.debug(`--> Fetching category with id ${categoryId}`);

                    return this.__getCategoryById(categoryId, actionParameters).catch((error) => {
                        console.error(
                            `Failed loading category ${categoryId}, got error ${JSON.stringify(error, null, 0)}`
                        );
                        return null;
                    });
                })
            );
        };

        this.loader = new DataLoader((keys) => loadingFunction(keys));
    }

    /**
     * Loads the category with the given categoryId.
     *
     * @param {*} categoryId
     * @returns {Promise} A Promise with the category data.
     */
    load(categoryId) {
        console.log('loading ' + categoryId)
        return this.loader.load(categoryId);
    }

    /**
     * In a real 3rd-party integration, this method would query the 3rd-party system
     * in order to fetch a category based on the category id. This method returns a Promise,
     * for example to simulate some HTTP REST call being performed to the 3rd-party commerce system.
     *
     * @param {Number} categoryId The category id (integer).
     * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
     * @returns {Promise} A Promise with the category data.
     */
    async __getCategoryById(categoryId, actionParameters) {
        // Each category contains the list of its sub-categories ids: the function CategoryTree.children()
        // demonstrates how these ids can be mapped to detailed category data.
        // In contrast, each category does not return the ids of the products it contains.
        // The function CategoryTree.products() shows how one would have to fetch the products
        // in an extra request if they are being requested in the GraphQL query.

        /*
        return Promise.resolve({
            uid: categoryId,
            slug: this.__toSlug(categoryId),
            title: `Category #${categoryId}`,
            description: `Fetched category #${categoryId} from ${actionParameters.url}`,
            subcategories: new String(categoryId).length < 3 ? [categoryId * 10 + 1, categoryId * 10 + 2] : []
        });
        */
        const response = await getRemoteJSON(actionParameters.dataSourceWithStore);

        const category = response.data.filter((row) =>
            row.category_uid.includes(categoryId) || row.parent_category_id.includes(categoryId)
        );

        const productCount = category.length;

        const subCategories = await getSubcategories(actionParameters.DATASOURCE, categoryId);

        return Promise.resolve(
            this.__mapProductRow(category.pop(), productCount, categoryId, subCategories)
        );
    }

    __mapProductRow(category, productCount, categoryId, subCategories) {
        let retCategoryId = '';

        if(typeof categoryId === 'string') {
            retCategoryId = categoryId;
        } else {
            retCategoryId = categoryId.pop();
        }

        let retCategory = {
            id: 0,
            uid: retCategoryId,
            slug: retCategoryId
        }

        if(!category) {
            return retCategory;
        }

        retCategory.product_count = productCount;

        retCategory.id = parseInt(category.category_id);
        retCategory.url_key = category.category_uid;
        
        retCategory.title = subCategories.length > 0 ? 'root category' : category.category_name;
        retCategory.description = subCategories.length > 0 ? 'This is root category' : category.category_description;
        retCategory.subcategories = subCategories;

        return retCategory;
    }
}

module.exports = CategoryTreeLoader;
