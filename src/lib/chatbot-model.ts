import mongoose,{Schema} from 'mongoose';
const schema=new Schema({key:{type:String,unique:true,required:true},revision:{type:Number,default:0},answers:{type:[Schema.Types.Mixed],default:[]},editedBy:{type:Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
export const ChatbotSettings=mongoose.models.ChatbotSettings||mongoose.model('ChatbotSettings',schema);
