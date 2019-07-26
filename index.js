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

export const dataFormatter = new Jsona()

export const JsonApiResource = function(resource, httpService) {
    let endpoints = {}
    methods.forEach((method) => {
        if(method.pluralize) {
            endpoints[camelCase(`${method.name}-${pluralize(resource.name)}`)] = function(params = {}) {
                return new Promise((resolve, reject) => {
                    httpService[`${method.method.toLowerCase()}`](resource.name, params)
                    .then((r) => resolve(dataFormatter.deserialize(r.data), r, dataFormatter))
                    .catch((e) => reject(e))
                })
            }
        } else {
            endpoints[camelCase(`${method.name}-${pluralize.singular(resource.name)}`)] = function(id, params = {}) {
                return new Promise((resolve, reject) => {
                    httpService[`${method.method.toLowerCase()}`](resource.name, params)
                    .then((r) => resolve(dataFormatter.deserialize(r.data), r, dataFormatter))
                    .catch((e) => reject(e))
                })
            }
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

export default { JsonApiResource, JsonApiResources, dataFormatter }
