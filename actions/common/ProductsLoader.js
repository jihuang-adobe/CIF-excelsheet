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
    getRemoteJSON
} = require('../services/remoteJSON.js');

class ProductsLoader {
    /**
     * @param {Object} [actionParameters] Some optional parameters of the I/O Runtime action, like for example authentication info.
     */
    constructor(actionParameters) {
        // A custom function to generate custom cache keys, simply serializing the key.
        let cacheKeyFunction = (key) => JSON.stringify(key, null, 0);

        // The loading function: the "key" is actually an object with search parameters
        let loadingFunction = (keys) => {
            return Promise.resolve(
                keys.map((key) => {
                    console.debug(
                        '--> Performing a search with ' +
                            JSON.stringify(key, null, 0)
                    );
                    return this.__searchProducts(key, actionParameters).catch(
                        (error) => {
                            console.error(
                                `Failed loading products for search ${JSON.stringify(
                                    key,
                                    null,
                                    0
                                )}, got error ${JSON.stringify(error, null, 0)}`
                            );
                            return null;
                    });
                })
            );
        };

        this.loader = new DataLoader((keys) => loadingFunction(keys), {
            cacheKeyFn: cacheKeyFunction
        });
    }

    load(key) {
        return this.loader.load(key);
    }

    __mapProductRow(product) {
        return {
            id: product.product_id,
            sku: product.product_sku,
            title: product.product_name,
            description: product.product_description,
            short_description: product.product_short_description,
            price: {
                currency: 'USD',
                amount: product.product_price
            },
            image_url: product.product_thumbnail_url,
            categoryIds: product.category_uid.split(',')
        };
    }

    __mapProductRowBack(product) {
        return {
            sku: product[0],
            title: product[1],
            description: product[2],
            short_description: product[4],
            price: {
                currency: 'USD',
                amount: product[8]
            },
            image_url: product[3],
            categoryIds: [product[10]]
        };
    }

    /**
     * In a real 3rd-party integration, this method would query the 3rd-party system to search
     * products based on the search parameters. Note that to demonstrate how one can customize the arguments
     * of a field, the "sort" argument of the "products" field has been removed from the schema
     * in the main dispatcher action.
     *
     * @param {Object} params An object with the search parameters defined by the Magento GraphQL "products" field.
     * @param {String} [params.search] The "search" argument of the GraphQL "products" field.
     * @param {String} [params.filter] The "filter" argument of the GraphQL "products" field.
     * @param {Object} actionParameters Some parameters of the I/O action itself (e.g. backend server URL, authentication info, etc)
     * @returns {Promise} A Promise with the products data.
     */
    async __searchProducts(params, actionParameters) {
        const response = await getRemoteJSON(actionParameters.DATASOURCE);

        console.log(params);

        let products = null;

        if (params.categoryId) {
            products = response.data.filter((row) =>
                row.parent_category_id.includes(params.categoryId) || row.category_uid.includes(params.categoryId)
            );
        } else if (params.search != null) {
            products = response.data.filter((row) =>
                row.product_name.toLowerCase().includes(params.search.length > 0 ? params.search.toLowerCase() : ' ')
            );
        } else if (params.filter) {
            if (params.filter.sku || params.filter.url_key) {
                let keys = params.filter.sku
                    ? params.filter.sku.eq
                        ? [params.filter.sku.eq]
                        : params.filter.sku.in
                    : params.filter.url_key.eq
                    ? [params.filter.url_key.eq]
                    : params.filter.url_key.in;

                products = response.data.filter((row) =>
                    keys.includes(row.product_sku)
                );
            }
            if (params.filter.category_uid || params.filter.category_id) {
                let keys;

                if(params.filter.category_uid) {
                    if(params.filter.category_uid.eq) {
                        keys = [params.filter.category_uid.eq];
                    }

                    if(params.filter.category_uid.in) {
                        keys = params.filter.category_uid.in;
                    }
                }

                if(params.filter.category_id) {
                    if(params.filter.category_id.eq) {
                        keys = [params.filter.category_id.eq];
                    }
                }

                products = response.data.filter((row) =>
                    keys.includes(row.category_uid) || keys.includes(row.parent_category_id)
                );
            }
            if (params.filter.price) {
                products = response.data.filter((row) =>
                    row.product_price != null
                );
            }
        }

        const productsPaginated = this.paginate(products, params.pageSize, params.currentPage);

        return Promise.resolve({
            total: products.length,
            offset: params.currentPage * params.pageSize,
            limit: params.pageSize,
            products: productsPaginated.map((product) => {
                return this.__mapProductRow(product);
            })
        });
    }

    paginate(array, page_size, page_number) {
        // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
        return array.slice((page_number - 1) * page_size, page_number * page_size);
    }
}

module.exports = ProductsLoader;
