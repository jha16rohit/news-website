import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import News from "../models/News";
import { EDITOR_PERMISSIONS } from "../constants/permissions";

const EDITOR_STATUSES = ["Active", "Inactive", "Deleted"] as const;

type EditorStatus = (typeof EDITOR_STATUSES)[number];

const getEditorResponse = (editor: any, newsCount = 0) => ({
  _id: editor._id,
  userId: editor.userId,
  name: editor.name,
  email: editor.email,
  phone: editor.phone,
  role: editor.role,
  permissions: editor.permissions || [],
  status: editor.status || "Active",
  createdAt: editor.createdAt,
  newsCount,
});

/**
 * GET ALL EDITORS
 * Returns editors including status and news count.
 */
export const getEditors = async (req: Request, res: Response) => {
  try {
    const editors = await User.find({
      role: "EDITOR",
    })
      .select(
        "_id userId name email phone role permissions status createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const editorIds = editors.map((editor) => String(editor._id));

    const newsCounts = await News.aggregate([
      {
        $match: {
          authorId: {
            $in: editorIds,
          },
        },
      },
      {
        $group: {
          _id: "$authorId",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const newsCountMap = new Map<string, number>();

    newsCounts.forEach((item) => {
      newsCountMap.set(String(item._id), item.count);
    });

    const editorsWithCount = editors.map((editor) =>
      getEditorResponse(
        editor,
        newsCountMap.get(String(editor._id)) || 0
      )
    );

    return res.status(200).json({
      editors: editorsWithCount,
    });
  } catch (error) {
    console.error("GET EDITORS ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/**
 * CREATE EDITOR
 */
export const createEditor = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      permissions = [],
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    const lastEditor = await User.findOne({
      userId: /^ED\d+$/i,
    }).sort({ userId: -1 });

    let nextNumber = 1;

    if (lastEditor?.userId) {
      const match = lastEditor.userId.match(/^ED(\d+)$/i);

      if (match) {
        nextNumber = Number(match[1]) + 1;
      }
    }

    const userId = `ED${String(nextNumber).padStart(3, "0")}`;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        message: "Permissions must be an array",
      });
    }

    const invalidPermissions = permissions.filter(
      (permission) =>
        typeof permission !== "string" ||
        !EDITOR_PERMISSIONS.includes(permission as any)
    );

    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        message: "Invalid permission(s)",
        invalidPermissions,
      });
    }

    const validPermissions = [...new Set(permissions)];

    const hashedPassword = await bcrypt.hash(password, 10);

    const editor = await User.create({
      userId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || undefined,
      role: "EDITOR",
      permissions: validPermissions,
      status: "Active",
    });

    return res.status(201).json({
      message: "Editor created successfully",
      user: getEditorResponse(editor, 0),
    });
  } catch (error) {
    console.error("CREATE EDITOR ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/**
 * UPDATE EDITOR
 */
export const updateEditor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    const editor = await User.findOne({
      _id: id,
      role: "EDITOR",
    });

    if (!editor) {
      return res.status(404).json({
        message: "Editor not found",
      });
    }

    if (editor.status === "Deleted") {
      return res.status(400).json({
        message: "Deleted editor cannot be updated",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      editor.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();

      if (!normalizedEmail) {
        return res.status(400).json({
          message: "Email cannot be empty",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Email already belongs to another user",
        });
      }

      editor.email = normalizedEmail;
    }

    if (phone !== undefined) {
      editor.phone = phone.trim();
    }

    if (password) {
      editor.password = await bcrypt.hash(password, 10);
    }

    await editor.save();

    const newsCount = await News.countDocuments({
      authorId: String(editor._id),
    });

    return res.status(200).json({
      message: "Editor updated successfully",
      user: getEditorResponse(editor, newsCount),
    });
  } catch (error) {
    console.error("UPDATE EDITOR ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/**
 * UPDATE EDITOR PERMISSIONS
 */
export const updateEditorPermissions = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        message: "Permissions must be an array",
      });
    }

    const invalidPermissions = permissions.filter(
      (permission) =>
        typeof permission !== "string" ||
        !EDITOR_PERMISSIONS.includes(permission as any)
    );

    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        message: "Invalid permission(s)",
        invalidPermissions,
      });
    }

    const uniquePermissions = [...new Set(permissions)];

    const editor = await User.findOneAndUpdate(
      {
        _id: id,
        role: "EDITOR",
      },
      {
        $set: {
          permissions: uniquePermissions,
        },
      },
      {
        new: true,
      }
    ).select(
      "_id userId name email phone role permissions status createdAt"
    );

    if (!editor) {
      return res.status(404).json({
        message: "Editor not found",
      });
    }

    const newsCount = await News.countDocuments({
      authorId: String(editor._id),
    });

    return res.status(200).json({
      message: "Editor permissions updated successfully",
      user: getEditorResponse(editor, newsCount),
    });
  } catch (error) {
    console.error("UPDATE EDITOR PERMISSIONS ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/**
 * UPDATE EDITOR STATUS
 * Active <-> Inactive
 */
export const updateEditorStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body as {
      status?: EditorStatus;
    };

    if (
      status !== "Active" &&
      status !== "Inactive"
    ) {
      return res.status(400).json({
        message: "Status must be Active or Inactive",
      });
    }

    const editor = await User.findOne({
      _id: id,
      role: "EDITOR",
    });

    if (!editor) {
      return res.status(404).json({
        message: "Editor not found",
      });
    }

    if (editor.status === "Deleted") {
      return res.status(400).json({
        message: "Deleted editor cannot be activated or deactivated",
      });
    }

    editor.status = status;

    await editor.save();

    const newsCount = await News.countDocuments({
      authorId: String(editor._id),
    });

    return res.status(200).json({
      message: `Editor ${
        status === "Active"
          ? "activated"
          : "deactivated"
      } successfully`,
      user: getEditorResponse(editor, newsCount),
    });
  } catch (error) {
    console.error("UPDATE EDITOR STATUS ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/**
 * DELETE EDITOR
 *
 * We use soft delete so the Editor remains available
 * under the "Deleted" filter/statistic.
 */
export const deleteEditor = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const editor = await User.findOne({
      _id: id,
      role: "EDITOR",
    });

    if (!editor) {
      return res.status(404).json({
        message: "Editor not found",
      });
    }

    if (editor.status === "Deleted") {
      return res.status(400).json({
        message: "Editor is already deleted",
      });
    }

    editor.status = "Deleted";

    await editor.save();

    const newsCount = await News.countDocuments({
      authorId: String(editor._id),
    });

    return res.status(200).json({
      message: "Editor deleted successfully",
      user: getEditorResponse(editor, newsCount),
    });
  } catch (error) {
    console.error("DELETE EDITOR ERROR:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};