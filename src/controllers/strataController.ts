import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import {
  getAllStratas,
  getStrataByIdOrName,
  createStrata,
  updateStrata,
  deleteStrata,
} from '../services/strataService.js';

// Get all stratas
export const getStratas = (_: Request, res: Response): void => {
  try {
    const stratas = getAllStratas();
    const response: ApiResponse = {
      success: true,
      data: stratas,
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get stratas information',
    });
  }
};

// Get a specific strata by ID or name
export const getStrata = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Strata ID is required',
      });
      return;
    }

    const strata = getStrataByIdOrName(id);
    if (!strata) {
      res.status(404).json({
        success: false,
        message: 'Strata not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: strata,
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get strata information',
    });
  }
};

// Create a new strata
export const createNewStrata = (req: Request, res: Response): void => {
  try {
    const { name, description, servers, owner } = req.body;
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Strata name is required',
      });
      return;
    }

    const serverList = Array.isArray(servers) ? servers : [];
    const strata = createStrata(name, description, serverList, owner);

    if (!strata) {
      res.status(400).json({
        success: false,
        message: 'Failed to create strata. Check if strata name already exists or servers are valid.',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: strata,
      message: 'Strata created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('[strataController] Error creating strata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create strata',
    });
  }
};

// Update an existing strata
export const updateExistingStrata = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Strata ID is required',
      });
      return;
    }

    const { name, description, servers, owner } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (servers !== undefined) updateData.servers = servers;
    if (owner !== undefined) updateData.owner = owner;

    const strata = updateStrata(id, updateData);

    if (!strata) {
      res.status(404).json({
        success: false,
        message: 'Strata not found or update failed',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: strata,
      message: 'Strata updated successfully',
    };
    res.json(response);
  } catch (error) {
    console.error('[strataController] Error updating strata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update strata',
    });
  }
};

// Delete a strata
export const deleteExistingStrata = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Strata ID is required',
      });
      return;
    }

    const success = deleteStrata(id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Strata not found or deletion failed',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Strata deleted successfully',
    };
    res.json(response);
  } catch (error) {
    console.error('[strataController] Error deleting strata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete strata',
    });
  }
};
