import mongoose, { Document } from "mongoose";
export interface IStory extends Document {
    userId: mongoose.Types.ObjectId;
    mediaUrl: string;
    mediaType: "image" | "video";
    viewers: mongoose.Types.ObjectId[];
    likes: mongoose.Types.ObjectId[];
    expiresAt: Date;
    createdAt: Date;
}
export declare const Story: mongoose.Model<IStory, {}, {}, {}, mongoose.Document<unknown, {}, IStory, {}, mongoose.DefaultSchemaOptions> & IStory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IStory>;
//# sourceMappingURL=Story.d.ts.map