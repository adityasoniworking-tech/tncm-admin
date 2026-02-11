// --- CATEGORY & FILTER LOGIC ---

window.addNewCategory = async function() {
    const catName = document.getElementById('newCatName').value.trim();
    const pos = Number(prompt("Enter filter position (e.g., 0 for first, 1 for second):")) || 0; 
    
    if(!catName) return alert("Filter name cannot be empty!");
    const slug = catName.toLowerCase().replace(/ /g, '-'); 

    try {
        await db.collection("categories").doc(slug).set({
            name: catName,
            slug: slug,
            pos: pos
        });
        alert("Filter Added!");
        loadCategories();
    } catch (e) { alert("Error: " + e.message); }
};

function loadCategories() {
    const listDiv = document.getElementById('adminCategoryList');
    const selectDropdown = document.getElementById('newCat'); 
    
    db.collection("categories").onSnapshot(snapshot => {
        if(listDiv) listDiv.innerHTML = "";
        if(selectDropdown) selectDropdown.innerHTML = ""; 

        snapshot.forEach(doc => {
            const data = doc.data();
            
            if(listDiv) {
                listDiv.innerHTML += `
                    <div style="background:#f3f4f6; padding:5px 12px; border-radius:20px; display:flex; align-items:center; gap:8px; font-size:0.85rem; border:1px solid #e5e7eb;">
                        ${data.name} 
                        <i class="fa-solid fa-circle-xmark text-red-500 cursor-pointer hover:text-red-700" onclick="deleteCategory('${doc.id}')"></i>
                    </div>`;
            }
            
            if(selectDropdown) {
                selectDropdown.innerHTML += `<option value="${data.slug}">${data.name}</option>`;
            }
        });
    });
}

window.deleteCategory = async function(id) {
    if(confirm("Are you sure? Items in this category will not be deleted, but the filter will be removed from the menu.")) {
        try {
            await db.collection("categories").doc(id).delete();
            alert("Filter deleted!");
        } catch (e) { alert("Error: " + e.message); }
    }
};

console.log('Categories Module Loaded');
