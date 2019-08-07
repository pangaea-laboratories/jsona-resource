import axios from 'axios'
import Jsona from 'jsona'
import pluralize from 'pluralize'
import { extend, merge, camelCase, isObject, isString, isFunction } from 'lodash'

const defaultConfig = {
    httpService: axios,
    errorEventHandler: function(error, callback) {
        callback(error)
    }
}

export const methods = [
    {
        name: 'fetch',
        method: 'GET',
        pluralize: true,
        promise(resource, config, params, callback) {
            console.log(parseParams(params))
            return new Promise((resolve, reject) => {
                config.httpService[`${this.method.toLowerCase()}`](resource, {
                    params: parseParams(params) || {}
                })
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => {
                    config.errorEventHandler(error, (error) => {
                        responseError(error, callback, reject)
                    })
                })
            })
        }
    },
    {
        name: 'fetch',
        method: 'GET',
        pluralize: false,
        promise(resource, config, entity, related, params, callback) {
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
                config.httpService[`${this.method.toLowerCase()}`](`${resource}/${entity}${related}`, {
                    params: parseParams(params)
                })
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => {
                    config.errorEventHandler(error, (error) => {
                        responseError(error, callback, reject)
                    })
                })
            })
        }
    },
    {
        name: 'create',
        method: 'POST',
        pluralize: false,
        promise(resource, config, entity, callback) {
            entity = isObject(entity) ? { stuff: entity } : { stuff: {} }
            entity.stuff.type = resource
            let params = dataFormatter.serialize(entity)
            return new Promise((resolve, reject) => {
                config.httpService[`${this.method.toLowerCase()}`](`${resource}`, params)
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => {
                    config.errorEventHandler(error, (error) => {
                        responseError(error, callback, reject)
                    })
                })
            })
        }
    },
    {
        name: 'update',
        method: 'PATCH',
        pluralize: false,
        promise(resource, config, entity, callback) {
            let params = dataFormatter.serialize({ stuff: entity })
            return new Promise((resolve, reject) => {
                config.httpService[`${this.method.toLowerCase()}`](`${resource}/${getEntityId(entity)}`, params)
                .then((response) => responseJsona(response, callback, resolve))
                .catch((error) => {
                    config.errorEventHandler(error, (error) => {
                        responseError(error, callback, reject)
                    })
                })
            })
        }
    },
    {
        name: 'delete',
        method: 'DELETE',
        pluralize: false,
        promise(resource, config, entity, callback) {
            return new Promise((resolve, reject) => {
                config.httpService[`${this.method.toLowerCase()}`](`${resource}/${getEntityId(entity)}`)
                .then((response) => responseRaw(response, callback, resolve))
                .catch((error) => {
                    config.errorEventHandler(error, (error) => {
                        responseError(error, callback, reject)
                    })
                })
            })
        }
    },
]

export const dataFormatter = new Jsona()

const getEntityId = (entity) => {
    return isObject(entity) ? entity.id : entity
}

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
        callback({error})
    }
}

const responseJsona = (response, callback, resolve) => {
    resolve(dataFormatter.deserialize(response.data))
    if(isFunction(callback)) {
        callback(response, dataFormatter)
    }
}

export const JsonApiResource = function(resource, config = {}) {
    let endpoints = {}
    let resourceNamePlural = pluralize(resource)
    let resourceNameSingular = pluralize.singular(resource)
    config = extend(defaultConfig, config)
    methods.forEach((method) => {
        let resourceName = (method.pluralize) ? resourceNamePlural : resourceNameSingular
        let endpointName = camelCase(`${method.name}-${resourceName}`)
        endpoints[endpointName] = (...args) => method.promise(resourceNamePlural, config, ...args)
    })
    endpoints[camelCase(`update-${resourceNameSingular}-relationship`)] = (entity, relation, payload, callback) => {
        return new Promise((resolve, reject) => {
            config.httpService.patch(`${resource}/${getEntityId(entity)}/relationships/${relation}`, { data: payload })
            .then((response) => responseRaw(response, callback, resolve))
            .catch((error) => {
                config.errorEventHandler(error, (error) => {
                    responseError(error, callback, reject)
                })
            })
        })
    }
    return endpoints
}

export const JsonApiResources = function(resources, config = {}) {
    let endpoints = {}
    resources.forEach((resource) => {
        merge(endpoints, JsonApiResource(resource, config))
    })
    return endpoints
}

export default JsonApiResources
