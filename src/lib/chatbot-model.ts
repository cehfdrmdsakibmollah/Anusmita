import mongoose,{Schema} from 'mongoose';
const schema=new Schema({key:{type:String,unique:true,required:true},revision:{type:Number,default:0},answers:{type:[Schema.Types.Mixed],default:[]},editedBy:{type:Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
export const ChatbotSettings=mongoose.models.ChatbotSettings||mongoose.model('ChatbotSettings',schema);

/** Immutable snapshots created only when a reply revision is published. */
const revisionSchema=new Schema({key:{type:String,required:true},revision:{type:Number,required:true},answers:{type:[Schema.Types.Mixed],required:true},editedBy:{type:Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
revisionSchema.index({key:1,revision:1},{unique:true});
export const ChatbotRevision=mongoose.models.ChatbotRevision||mongoose.model('ChatbotRevision',revisionSchema);
