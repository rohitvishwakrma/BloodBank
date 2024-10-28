document.querySelector('form').addEventListener('submit', function(e){
    e.preventDefault();
    let Fields = [
        Blood_Bank_Name,
        Email,
        Pincode,
        Address,
        district,
        state,
        License_Expiry,
        License_Issue,
        Licence_No,
        Contact_No,
        Person_Name,
        Category
    ];
    let allFilled =   Fields.every(field => field.value.trim() !== "");

    if (!allFilled) {
        alert('Please fill in all required fields.');
        first(); 
        return;
    } 
    let checkboxGroups = [
        document.querySelectorAll('input[name="Donor_Type"]:checked'),
        document.querySelectorAll('input[name="Donation_Type"]:checked'),
        document.querySelectorAll('input[name="Component_Type"]:checked'),
        document.querySelectorAll('input[name="Bag_Type"]:checked'),
        document.querySelectorAll('input[name="TTI_Type"]:checked')
    ];

    for (let i = 0; i < checkboxGroups.length; i++) {
        if (checkboxGroups[i].length === 0) {
            const sectionNames = ['Donor Type', 'Donation Type', 'Component Type', 'Bag Type', 'TTI Type'];
            alert(`Please select at least one option from the ${sectionNames[i]} section.`);
            second(); 
            return;
        }
    }
    alert('Form submitted successfully!');
    this.submit(); 
}) 

function first(){
    document.getElementsByClassName('box')[0].style.zIndex='0';
    document.getElementsByClassName('box1')[0].style.zIndex='-1';
    document.getElementById("btn2").style.top=0;
    document.getElementById("btn1").style.top=0.1+"vh";
    document.getElementById("btn1").style.color="#BF222B";
    document.getElementById("btn2").style.color="gray";
    document.getElementById("btn1").style.borderTop = "1px solid #BF222B";
    document.getElementById("btn1").style.borderLeft = "1px solid #BF222B";
    document.getElementById("btn1").style.borderRight = "1px solid #BF222B";
    document.getElementById("btn2").style.border="0px solid";
}
function second(){
    document.getElementsByClassName('box')[0].style.zIndex='-1';
    document.getElementsByClassName('box1')[0].style.zIndex='0';
    document.getElementById("btn1").style.top=0;
    document.getElementById("btn2").style.top=0.1+"vh";
    document.getElementById("btn2").style.color="#BF222B";
    document.getElementById("btn1").style.color="gray";
    document.getElementById("btn2").style.borderTop = "1px solid #BF222B";
    document.getElementById("btn2").style.borderLeft = "1px solid #BF222B";
    document.getElementById("btn2").style.borderRight = "1px solid #BF222B";
    document.getElementById("btn1").style.border="0px solid";
}