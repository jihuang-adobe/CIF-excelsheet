'use strict';

const magentoSchemaOriginal = require('../resources/master-7rqtwti-3tc6abac5dub2.us-4.magentosite.cloud.json');
const cockpitCategoryByParentUIDPagination = require('../resources/cockpitCategoryByParentUIDPagination.json');
const cockpitCategoryWithProductsUIDPagination = require('../resources/cockpitCategoryWithProductsUIDPagination.json');
const storeConfigQuery = require('../resources/storeConfig.json');

class CustomRouter {
    constructor() {
    }

    process(operationName) {
        let response = null;

        switch(operationName) {
            case 'IntrospectionQuery':            
                response =  {
                    statusCode: 200,
                    body: magentoSchemaOriginal
                }
            break;

            case 'StoreConfigQuery':
                response = {
                    statusCode: 200,
                    body: storeConfigQuery
                }
            break;
    
            case 'cockpitCategoryByParentUIDPagination':
                /*
                response = {
                    statusCode: 200,
                    body: cockpitCategoryByParentUIDPagination
                }
                */
            break;
    
            case 'cockpitCategoryWithProductsUIDPagination':
                /*
                response = {
                    statusCode: 200,
                    body: cockpitCategoryWithProductsUIDPagination
                }
                */
            break;
        };
    
        return response;
    }
}

module.exports = CustomRouter;
