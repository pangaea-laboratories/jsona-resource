import Jsona from 'jsona'
import pluralize from 'pluralize'
import { merge, camelCase } from 'lodash'

export const methods = [
    {
        name: 'fetch',
        method: 'GET',
        pluralize: true
    },
    {
        name: 'fetch',
        method: 'GET',
        pluralize: false
    },
    {
        name: 'create',
        method: 'POST',
        pluralize: false
    },
    {
        name: 'update',
        method: 'PUT',
        pluralize: false
    },
    {
        name: 'remove',
        method: 'delete',
        pluralize: false
    },
]

const dataFormatter = new Jsona()

const endpoint = (resource, method, httpService) => {
    return function(params = {}, callback) {
        if(params.include instanceof Array) {
            params.include = params.include.join(',')
        }
        return new Promise((resolve, reject) => {
            httpService[`${method.method.toLowerCase()}`](resource.name, { params })
            .then((response) => {
                resolve(dataFormatter.deserialize(response.data))
                if(typeof callback === 'function') {
                    callback(response, dataFormatter)
                }
            })
            .catch((error) => reject(error))
        })
    }
}

export const JsonApiResource = function(resource, httpService) {
    let endpoints = {}
    methods.forEach((method) => {
        if(method.pluralize) {
            endpoints[camelCase(`${method.name}-${pluralize(resource.name)}`)] = endpoint(resource, method, httpService)
        } else {
            endpoints[camelCase(`${method.name}-${pluralize.singular(resource.name)}`)] = endpoint(resource, method, httpService)
        }
    })
    return endpoints
}

export const JsonApiResources = function(resources, httpService) {
    let endpoints = {}
    resources.forEach((resource) => {
        merge(endpoints, JsonApiResource(resource, httpService))
    })
    return endpoints
}

export default JsonApiResources
