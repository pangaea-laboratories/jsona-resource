import Jsona from 'jsona'
import pluralize from 'pluralize'
import { merge, camelCase, isObject, isString, isFunction } from 'lodash'

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

const parseParams = (params) => {
    if(params.include instanceof Array) {
        params.include = params.include.join(',')
    }

    return params
}

const errorFunction = (error, callback, reject) => {
    reject(error)
    if(isFunction(callback)) {
        callback(error)
    }
}

const responseFunction = (response, callback, resolve) => {
    resolve(dataFormatter.deserialize(response.data))
    if(isFunction(callback)) {
        callback(response, dataFormatter)
    }
}

export const JsonApiResource = function(resource, httpService) {
    let endpoints = {}
    methods.forEach((method) => {
        if(method.pluralize) {
            endpoints[camelCase(`${method.name}-${pluralize(resource)}`)] = function(params = {}, callback) {
                return new Promise((resolve, reject) => {
                    httpService[`${method.method.toLowerCase()}`](resource, { params: parseParams(params) })
                    .then((response) => responseFunction(response, callback, resolve))
                    .catch((error) => errorFunction(error, callback, reject))
                })
            }
        } else {
            endpoints[camelCase(`${method.name}-${pluralize.singular(resource)}`)] = function() {
                let id = isObject(arguments[0]) ? arguments[0].id : arguments[0]
                let uri = isString(arguments[1]) ? `/${arguments[1]}` : ''
                let params = isObject(arguments[1]) ? arguments[1] : arguments[2] || {}
                let callback = isFunction(arguments[2]) ? arguments[2] : arguments[3]

                return new Promise((resolve, reject) => {
                    httpService[`${method.method.toLowerCase()}`](`${resource}/${id}${uri}`, {
                        params: parseParams(params)
                    })
                    .then((response) => responseFunction(response, callback, resolve))
                    .catch((error) => errorFunction(error, callback, reject))
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

export default JsonApiResources
