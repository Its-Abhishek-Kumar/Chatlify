import mongoose from "mongoose";
export declare const Message: mongoose.Model<{
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    text: string;
    reactions: mongoose.Types.DocumentArray<{
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, unknown, {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }, {}, {}> & {
        emoji: string;
        reactedAt: NativeDate;
        userId?: mongoose.Types.ObjectId | null;
    }>;
    edited: boolean;
    deleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    status: "sent" | "delivered" | "seen";
    readBy: mongoose.Types.ObjectId[];
    forwarded: boolean;
    conversationId?: mongoose.Types.ObjectId | null;
    senderId?: mongoose.Types.ObjectId | null;
    media?: {
        type?: "image" | "video" | "file" | null;
        name?: string | null;
        size?: number | null;
        url?: string | null;
        mimeType?: string | null;
        downloadUrl?: string | null;
    } | null;
    replyTo?: mongoose.Types.ObjectId | null;
    expiresAt?: NativeDate | null;
    linkPreview?: {
        description?: string | null;
        url?: string | null;
        image?: string | null;
        title?: string | null;
    } | null;
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=Message.d.ts.map