import type { Request, Response } from "express";
import User from "../models/User.ts";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token.ts";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password, name, avatar } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({
        success: false,
        msg: "User already exists",
      });
      return;
    }

    // create new user
    user = new User({
      email,
      password,
      name,
      avatar: avatar || "",
    });

    // hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    //save user
    await user.save();

    // gen token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    // Check if already exists
    let user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
      return;
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
      return;
    }

    // gen token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
};
