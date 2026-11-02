


interface StepCard {

    label : string ;
}
export const StepCard = (props : StepCard) => {
    const {label} = props ; 
    return (
       
        
    <div className="flex w-full h-full border border-solid border-[#dfe4ee] p-7 rounded-2xl">
        <p className="font-sans text-bold text-[26px] ">{label}</p>
    </div>
    
    
        
    )
}