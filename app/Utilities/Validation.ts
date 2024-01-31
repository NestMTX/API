import dot from 'dot-object'
import Joi from 'joi'
import { inspect } from 'util'

export class RequestSchemaValidationError extends Error {
  public messages?: Array<string>

  constructor(messages?: Array<string>) {
    super('Request schema validation failed')
    this.messages = messages
    Object.setPrototypeOf(this, RequestSchemaValidationError.prototype)
  }
}

export async function getValidatedPayload<T = any>(schema: Joi.Schema, request: any) {
  try {
    await schema.validateAsync(request)
  } catch (error) {
    return new RequestSchemaValidationError(
      error.details.map(({ message, path }) => {
        const dotPath = path.join('.')
        const value = dot.pick(dotPath, request)
        return `${message}, but got "${inspect(value, { depth: 2 })}"`
      })
    )
  }
  return request as T
}

export const joi: typeof Joi = Joi
