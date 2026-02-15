// --- MENU MANAGEMENT ---
function loadAdminMenu() {
    const list = document.getElementById('adminMenuList');
    list.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:20px;'>Loading items...</td></tr>";

    db.collection("menu").orderBy("id").onSnapshot(snapshot => {
        list.innerHTML = "";
        if(snapshot.empty) {
            list.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:20px;'>No items found. Click 'Upload Items'.</td></tr>";
            return;
        }

        snapshot.forEach(doc => {
            const item = doc.data();
            const docId = doc.id;
            const imgVal = item.image || "";

            list.innerHTML += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:15px;">${item.name}<br><small style="color:#888;">ID: ${item.id}</small></td>
                    <td style="padding:15px;"><input type="number" id="price-${docId}" value="${item.price}" style="width:70px; padding:5px; border:1px solid #ddd;"></td>
                    <td style="padding:15px;">
                        <select id="stock-${docId}" style="padding:5px; border:1px solid #ddd;">
                            <option value="true" ${item.inStock ? 'selected' : ''}>In Stock</option>
                            <option value="false" ${!item.inStock ? 'selected' : ''}>Out of Stock</option>
                        </select>
                    </td>
                    <td style="padding:15px; min-width: 250px;">
                        <input type="text" id="img-${docId}" value="${imgVal}" placeholder="Image Link" style="width:100%; padding:5px; border:1px solid #ddd; margin-bottom: 5px;">
                        
                        <div style="display: flex; gap: 5px; align-items: center;">
                             ${imgVal ? `<a href="${imgVal}" target="_blank" style="margin-left:5px; color: var(--primary);"><i class="fa-solid fa-eye"></i> View</a>` : ''}
                        </div>
                    </td>
                    <td style="padding:15px;"><button onclick="updateMenuItem('${docId}')" style="background:#111827; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;">Update</button></td>
                    <td style="padding:15px;"><button onclick="confirmDeleteMenuItem('${docId}', '${item.name}')" style="background:#dc2626; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Delete</button></td>
                </tr>`;
        });
    });
}

// Confirm Delete Function
window.confirmDeleteMenuItem = function(docId, itemName) {
    if(confirm(`Are you sure you want to delete "${itemName}" (ID: ${docId})?\n\nThis action cannot be undone!`)) {
        deleteMenuItem(docId);
    }
}

// Delete Function
window.deleteMenuItem = async function(docId) {
    try {
        await db.collection("menu").doc(docId).delete();
        alert("Item (ID: " + docId + ") has been deleted successfully.");
        // Reload the menu to show updated list
        loadAdminMenu();
    } catch (e) { 
        alert("Error deleting item: " + e.message); 
    }
}

function updateMenuItem(docId) {
    const newPrice = Number(document.getElementById(`price-${docId}`).value);
    const newStock = document.getElementById(`stock-${docId}`).value === "true";
    const newImg = document.getElementById(`img-${docId}`).value;

    db.collection("menu").doc(docId).update({ price: newPrice, inStock: newStock, image: newImg })
      .then(() => alert("Item updated!"));
}

window.uploadImage = function(docId, event) {
    const file = event.target.files[0];
    if (!file) return;

    const uploadBtn = event.target.nextElementSibling;
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    uploadBtn.disabled = true;

    const storageRef = storage.ref(`menu_images/${docId}_${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress.toFixed(0) + '% done');
            uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${progress.toFixed(0)}%`;
        }, 
        (error) => {
            console.error("Upload failed:", error);
            alert("Image upload failed: " + error.message);
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
        }, 
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log('File available at', downloadURL);
                document.getElementById(`img-${docId}`).value = downloadURL;
                alert("Image uploaded successfully! Click 'Update' button to save it to the menu.");
                uploadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded!';
                
                setTimeout(() => {
                    uploadBtn.innerHTML = originalText;
                    uploadBtn.disabled = false;
                }, 3000);
            });
        }
    );
}

window.filterAdminTable = function() {
    const input = document.getElementById('adminSearchInput');
    const filter = input.value.toLowerCase();
    const table = document.getElementById('adminMenuList');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const rowText = rows[i].textContent || rows[i].innerText;
        
        if (rowText.toLowerCase().indexOf(filter) > -1) {
            rows[i].style.display = ""; 
        } else {
            rows[i].style.display = "none"; 
        }
    }
};

console.log('Menu Module Loaded');
