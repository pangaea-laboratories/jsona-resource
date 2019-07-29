import Jsona from 'jsona'
import pluralize from 'pluralize'
import { merge, camelCase, isObject, isString, isFunction } from 'lodash'

export const methods = [
    {
        name: 'fetch',
        method: 'GET',
        pluralize: true,
        promise(resource, http, params, callback) {
            return new Promise((resolve, reject) => {
                http[`${this.method.toLowerCase()}`](resource, parseParams(params) || {})
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => responseError(error, callback, reject))
            })
        }
    },
    {
        name: 'fetch',
        method: 'GET',
        pluralize: false,
        promise(resource, http, entity, related, params, callback) {
            if(isObject(entity)) {
                entity = entity.id
            }
            if(isString(related)) {
                params = params
                callback = callback
                related = related.startsWith('/') ? related : `/${related}`
            }
            if(isObject(related)) {
                callback = params
                params = related
                related = ''
            }

            return new Promise((resolve, reject) => {
                http[`${this.method.toLowerCase()}`](`${resource}/${entity}${related}`, {
                    params: parseParams(params)
                })
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => responseError(error, callback, reject))
            })
        }
    },
    {
        name: 'create',
        method: 'POST',
        pluralize: false,
        promise(resource, http, entity, callback) {
            entity = isObject(entity) ? { stuff: entity } : { stuff: {} }
            entity.stuff.type = resource
            let params = dataFormatter.serialize(entity)
            return new Promise((resolve, reject) => {
                http[`${this.method.toLowerCase()}`](`${resource}`, params)
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => responseError(error, callback, reject))
            })
        }
    },
    {
        name: 'update',
        method: 'PATCH',
        pluralize: false,
        promise(resource, http, entity, callback) {
            let id = isObject(entity) ? entity.id : entity
            let params = dataFormatter.serialize({ stuff: entity })
            return new Promise((resolve, reject) => {
                http[`${this.method.toLowerCase()}`](`${resource}/${id}`, params)
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => responseError(error, callback, reject))
            })
        }
    },
    {
        name: 'delete',
        method: 'DELETE',
        pluralize: false,
        promise(resource, http, entity, callback) {
            let id = isObject(entity) ? entity.id : entity
            return new Promise((resolve, reject) => {
                http[`${this.method.toLowerCase()}`](`${resource}/${id}`)
                .then((response) => responseRaw(response, callback, resolve))
                .catch((error) => responseError(error, callback, reject))
            })
        }
    },
]

const dataFormatter = new Jsona()

const parseParams = (params) => {
    if(params && params.include instanceof Array) {
        params.include = params.include.join(',')
    }
    return params
}

const responseRaw = (response, callback, resolve) => {
    resolve(response)
    if(isFunction(callback)) {
        callback(response)
    }
}

const responseError = (error, callback, reject) => {
    reject(error)
    if(isFunction(callback)) {
        callback({ error })
    }
}

const responseJsona = (response, callback, resolve) => {
    resolve(dataFormatter.deserialize(response.data))
    if(isFunction(callback)) {
        callback(response, dataFormatter)
    }
}

export const JsonApiResource = function(resource, http) {
    let endpoints = {}
    methods.forEach((method) => {
        let resourceName = (method.pluralize) ? pluralize(resource) : pluralize.singular(resource)
        let endpointName = camelCase(`${method.name}-${resourceName}`)
        endpoints[endpointName] = (...args) => method.promise(pluralize(resource), http, ...args)
    })
    return endpoints
}

export const JsonApiResources = function(resources, http) {
    let endpoints = {}
    resources.forEach((resource) => {
        merge(endpoints, JsonApiResource(resource, http))
    })
    return endpoints
}

export default JsonApiResources
