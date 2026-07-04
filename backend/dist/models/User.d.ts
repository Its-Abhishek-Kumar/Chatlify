import mongoose from "mongoose";
export declare const User: mongoose.Model<{
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    name: string;
    username: string;
    password: string;
    isOnline: boolean;
    avatar?: string | null;
    lastSeen?: NativeDate | null;
    email?: string | null;
    mobileNumber?: string | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=User.d.ts.map