
interface StepBarType {
    number : number ;
    label ?: string ;
}
export const StepBar = (props : StepBarType) => {
    const {number , label } = props ; 
    return (
        
        
    <div className="flex flex-col justify-center items-center">
        <div className="flex w-10 h-10 rounded-full border-2 border-solid border-[#dfe4ee] font-sans text-[15px] font-bold justify-center items-center cursor-pointer">
        {number} 
        </div>
        <div className="font-sans text-[15px] font-bold">{label}</div>
    </div>
   
    

    )
}
