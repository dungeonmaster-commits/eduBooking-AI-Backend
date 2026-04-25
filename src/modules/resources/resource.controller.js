import * as resourceService from './resource.service.js';
import { sendSuccess }      from '../../utils/response.util.js';

export const createResource = async (req, res, next) => {
  try {
    const resource = await resourceService.createResource(req.validatedBody, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message:    'Resource created successfully',
      data:       resource,
    });
  } catch (err) { next(err); }
};

export const getAllResources = async (req, res, next) => {
  try {
    // ✅ use validatedQuery (after route fix), fallback to validatedBody
    const filters = req.validatedQuery ?? req.validatedBody;
    console.log('filters:', filters);
    const result = await resourceService.getAllResources(filters);
    return sendSuccess(res, {
      message: 'Resources retrieved successfully',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const getResourceById = async (req, res, next) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    return sendSuccess(res, {
      message: 'Resource retrieved',
      data:    resource,
    });
  } catch (err) { next(err); }
};

export const updateResource = async (req, res, next) => {
  try {
    const resource = await resourceService.updateResource(
      req.params.id,
      req.validatedBody,
      req.user
    );
    return sendSuccess(res, {
      message: 'Resource updated successfully',
      data:    resource,
    });
  } catch (err) { next(err); }
};

export const deleteResource = async (req, res, next) => {
  try {
    await resourceService.deleteResource(req.params.id, req.user);
    return sendSuccess(res, { message: 'Resource deleted successfully' });
  } catch (err) { next(err); }
};

export const getResourceTypes = async (req, res, next) => {
  try {
    const types = await resourceService.getResourceTypes();
    return sendSuccess(res, { message: 'Resource types retrieved', data: types });
  } catch (err) { next(err); }
};

export const rateResource = async (req, res, next) => {
  try {
    const rating = await resourceService.rateResource(
      req.params.id,
      req.user.id,
      req.validatedBody
    );
    return sendSuccess(res, {
      statusCode: 201,
      message:    'Rating submitted successfully',
      data:       rating,
    });
  } catch (err) { next(err); }
};

// src/modules/resources/resource.controller.js
export const searchExternalResources = async (req, res, next) => {
  try {
    // ✅ use validatedQuery
    const results = await resourceService.searchExternalResources(req.validatedQuery);
    return sendSuccess(res, {
      message: 'External search results',
      data:    results,
    });
  } catch (err) { next(err); }
};

export const importExternalResource = async (req, res, next) => {
  try {
    const resource = await resourceService.importExternalResource(req.validatedBody);
    return sendSuccess(res, {
      statusCode: 201,
      message:    'External resource imported successfully',
      data:       resource,
    });
  } catch (err) { next(err); }
};