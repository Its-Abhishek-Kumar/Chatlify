import mongoose from "mongoose";
export declare const Conversation: mongoose.Model<{
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    type: "direct" | "group" | "channel" | "community";
    participants: mongoose.Types.ObjectId[];
    onlyAdminsCanPost: boolean;
    disappearingDuration: number;
    pinnedMessages: mongoose.Types.ObjectId[];
    name?: string | null;
    lastMessage?: mongoose.Types.ObjectId | null;
    avatar?: string | null;
    admin?: mongoose.Types.ObjectId | null;
    communityId?: mongoose.Types.ObjectId | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=Conversation.d.ts.map