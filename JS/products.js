// --- ADD & DELETE PRODUCTS ---

const defaultItems = [
    // Brownies
    { id: 1, name: "Classic chocolate brownie", price: 79, cat: "brownie", inStock: true, image: "https://bkmedia.bakingo.com/heavenly-choco-brownie-brow2948choc-AA.jpg" },
    { id: 2, name: "Walnut brownie", price: 89, cat: "brownie", inStock: true, image: "https://images.unsplash.com/photo-1515037893149-de7f840978e2" },
    { id: 3, name: "Nuts brownie", price: 99, cat: "brownie", inStock: true, image: "https://images.unsplash.com/photo-1589218436045-ee320057f443" },
    { id: 4, name: "Salted caramel brownie", price: 99, cat: "brownie", inStock: true, image: "https://bromabakery.com/wp-content/uploads/2014/11/scbrownie3-1067x1600.jpg" },
    { id: 5, name: "Marbled brownie", price: 109, cat: "brownie", inStock: true, image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e" },
    { id: 6, name: "Expresso / Mocha brownie", price: 119, cat: "brownie", inStock: true, image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2" },
    { id: 7, name: "Hazel-Nutella brownie", price: 139, cat: "brownie", inStock: true, image: "https://www.thedessertsymphony.in/cdn/shop/files/IMG-20230906-WA0000_1.jpg" },
    { id: 8, name: "Lotus-Biscoff brownie", price: 159, cat: "brownie", inStock: true, image: "https://images.unsplash.com/photo-1515037893149-de7f840978e2" },
    { id: 9, name: "Pistachio-Kunafa brownie", price: 159, cat: "brownie", inStock: true, image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e" },
    
    // Cheesecakes
    { id: 10, name: "Classic cheesecake", price: 119, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Classic%20cheesecake.png" },
    { id: 11, name: "Mango cheesecake", price: 129, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Mango%20cheesecake.png" },
    { id: 12, name: "Strawberry cheesecake", price: 129, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Strawberry%20cheesecake.png" },
    { id: 13, name: "Blueberry cheesecake", price: 139, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Blueberry%20cheesecake.png" },
    { id: 14, name: "Chocolate cheesecake", price: 139, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Chocolate%20cheesecake.png" },
    { id: 15, name: "Salted caramel cheesecake", price: 149, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Salted%20caramel%20cheesecake.png" },
    { id: 16, name: "Nutella cheesecake", price: 179, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Nutella%20cheesecake.png" },
    { id: 17, name: "Lotus-Biscoff cheesecake", price: 189, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Lotus-Biscoff%20cheesecake.png" },
    { id: 18, name: "Dubai Pistachio-Kunafa", price: 199, cat: "cheesecake", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/cheescake/Dubai%20Pistachio-Kunafa.png" },
    
    
    // Muffins
    { id: 19, name: "Rose & cardamom", price: 39, cat: "muffin", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/muffin/Rose%20&%20cardamom.png" },
    { id: 20, name: "Choco-chip", price: 59, cat: "muffin", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/muffin/Choco-chip.png" },
    { id: 21, name: "Blueberry", price: 59, cat: "muffin", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/muffin/Blueberry.png" },
    { id: 22, name: "Chocolate w/ ganache", price: 79, cat: "muffin", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/muffin/Chocolate%20w%20ganache.png" },
    { id: 23, name: "Nutella", price: 89, cat: "muffin", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/muffin/Nutella.png" },
    { id: 24, name: "Biscoff", price: 109, cat: "muffin", inStock: true, image: "https://ik.imagekit.io/afg8v0ied/muffin/Biscoff.png" },
    
    // Cookies
    { id: 25, name: "Blueberry cookie", price: 69, cat: "cookie", inStock: true, image: "https://ik.imagekit.io/ngavkj1dy/Blueberry%20cookie.png" },
    { id: 26, name: "Dark choco-chips", price: 69, cat: "cookie", inStock: true, image: "https://wholesomepatisserie.com/wp-content/uploads/2021/07/Bakery-Style-Dark-Chocolate-Chip-Cookies-Featured-Image.jpg" },
    { id: 27, name: "Salted caramel", price: 69, cat: "cookie", inStock: true, image: "https://ik.imagekit.io/ngavkj1dy/cookie%20Salted%20caramel.png" },
    { id: 28, name: "Red velvet & white choco", price: 69, cat: "cookie", inStock: true, image: "https://houseofnasheats.com/wp-content/uploads/2019/01/Red-Velvet-White-Chocolate-Chip-Cookies-9.jpg" },
    { id: 29, name: "Almond chocolate", price: 79, cat: "cookie", inStock: true, image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35" },
    { id: 30, name: "Cashew cookie", price: 79, cat: "cookie", inStock: true, image: "https://ik.imagekit.io/ngavkj1dy/Cashew%20cookie.png" },
    { id: 31, name: "Hazel-Nutella", price: 89, cat: "cookie", inStock: true, image: "https://i.ytimg.com/vi/5Is9bp691EM/hq720.jpg" },
    { id: 32, name: "Pistachio & choco-chip", price: 89, cat: "cookie", inStock: true, image: "https://ik.imagekit.io/ngavkj1dy/Pistachio%20&%20choco-chip.png" },
    { id: 33, name: "Classic butter (10 pc)", price: 99, cat: "cookie", inStock: true, image: "https://brownsbakery.in/cdn/shop/files/custom_resized_1733fe50-2a75-479a-bf0a-8a1c2113b1ff.jpg" },
    
    // Chocolates
    { id: 34, name: "Kunafa bites (25 gm)", price: 49, cat: "chocolate", inStock: true, image: "https://ik.imagekit.io/auwbv7fp3/Kunafa%20bites%20(25%20gm).png" },
    { id: 35, name: "Dark Choco Pistachio-Kunafa", price: 349, cat: "chocolate", inStock: true, image: "https://ik.imagekit.io/auwbv7fp3/chocolate%20%20Dark%20Choco%20Pistachio-Kunafa.png" }
];

function uploadDefaultMenu() {
    if(!confirm("Are you sure? This will OVERWRITE existing data with new images.")) return;
    
    // First, clear all existing menu items
    db.collection("menu").get().then((snapshot) => {
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(doc.ref.delete());
        });
        
        // After clearing all items, upload the default menu
        Promise.all(deletePromises).then(() => {
            let count = 0;
            defaultItems.forEach(item => {
                db.collection("menu").doc(String(item.id)).set(item)
                .then(() => {
                    count++;
                    console.log("Uploaded: " + item.name);
                    if(count === defaultItems.length) {
                        alert("All images uploaded successfully! Check your website now.");
                        loadAdminMenu();
                    }
                });
            });
        }).catch((error) => {
            console.error("Error clearing existing items:", error);
            alert("Error clearing existing items. Please try again.");
        });
    }).catch((error) => {
        console.error("Error getting existing items:", error);
        alert("Error getting existing items. Please try again.");
    });
}

window.addNewItem = async function() {
    const name = document.getElementById('newName').value.trim();
    const price = Number(document.getElementById('newPrice').value);
    const cat = document.getElementById('newCat').value;
    const imgFile = document.getElementById('newImgFile').files[0];
    const addBtn = document.querySelector('.btn-add-submit');

    if (!name || !price || !imgFile) {
        return alert("Please fill Name, Price and Select an Image!");
    }

    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const storageRef = storage.ref(`menu_images/new_${Date.now()}_${imgFile.name}`);
        const uploadTask = await storageRef.put(imgFile);
        const downloadURL = await uploadTask.ref.getDownloadURL();

        const snapshot = await db.collection("menu").get();
        const nextId = snapshot.size + 1;

        await db.collection("menu").doc(String(nextId)).set({
            id: nextId,
            name: name,
            price: price,
            cat: cat,
            inStock: true,
            image: downloadURL
        });

        alert("Product Added Successfully!");
        location.reload();
    } catch (error) {
        console.error("Error adding item:", error);
        alert("Error: " + error.message);
        addBtn.disabled = false;
        addBtn.innerText = "Add Product";
    }
}

window.addNewItemViaLink = async function() {
    const name = document.getElementById('newName').value.trim();
    const price = Number(document.getElementById('newPrice').value);
    const cat = document.getElementById('newCat').value;
    const imgLink = document.getElementById('newImgLink').value.trim();
    const addBtn = document.querySelector('.btn-add-submit');

    if (!name || !price || !imgLink) {
        return alert("Please fill Name, Price and Paste an Image Link!");
    }

    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const snapshot = await db.collection("menu").get();
        const nextId = snapshot.size + 1;

        await db.collection("menu").doc(String(nextId)).set({
            id: nextId,
            name: name,
            price: price,
            cat: cat,
            inStock: true,
            image: imgLink
        });

        alert("Product Added Successfully via Link!");
        location.reload(); 
    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + error.message);
        addBtn.disabled = false;
        addBtn.innerText = "Add Product";
    }
}

window.deleteMenuItem = async function() {
    const id = document.getElementById('deleteItemId').value.trim();
    if(!id) return alert("Please enter an Item ID to delete!");

    if(confirm(`Are you sure you want to PERMANENTLY delete Item #${id}?`)) {
        try {
            await db.collection("menu").doc(id).delete();
            alert("Item #" + id + " has been deleted.");
            document.getElementById('deleteItemId').value = "";
        } catch (e) { 
            alert("Error deleting item: " + e.message); 
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadAdminMenu(); 
});

console.log('Products Module Loaded');
