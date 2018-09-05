const inputTextElement  = document.getElementById('input_text');
const inputImageElement = document.getElementById('input_image');
const inputUrlElement   = document.getElementById('input_url');

// selectに応じてformを変更
const createForm = () => {
    console.log("createForm");
  
    let idx = selectElement.selectedIndex;
    let selectedValue = selectElement.options[idx].value;
  
    switch( selectedValue ) {
        case 'text':
            inputTextElement.style.display = '';
            inputImageElement.style.display = 'none';
            inputUrlElement.style.display = 'none';
            break;
    
        case 'image':
            inputTextElement.style.display = 'none';
            inputImageElement.style.display = '';
            inputUrlElement.style.display = 'none';
            break;
        
        case 'movie': //必要なだけcaseを追加していく…
            inputTextElement.style.display = 'none';
            inputImageElement.style.display = 'none';
            inputUrlElement.style.display = '';
            break;
    }
}

document.getElementById("select").addEventListener("change", createForm);