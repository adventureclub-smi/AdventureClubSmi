import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { optimizeImage } from "@/lib/media-optimize";

export async function GET(
req:Request,
{
params,
}:{
params:Promise<{id:string}>
}
){

const {id}=await params;

const trek=await prisma.trek.findUnique({

where:{

id,

},

});

if(!trek){

return NextResponse.json(

{

message:"Not Found",

},

{

status:404,

}

)

}

return NextResponse.json({ ...trek, coverImage: optimizeImage(trek.coverImage) });

}