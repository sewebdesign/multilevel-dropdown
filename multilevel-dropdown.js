document.addEventListener('DOMContentLoaded', function() {
  // Get language labels from existing elements
  function getLanguageLabels() {
    // Find existing folder label in the DOM to extract translations
    const existingFolderLabel = document.querySelector('.header-menu-nav-item .visually-hidden');
    
    return {
      folder: existingFolderLabel ? existingFolderLabel.textContent.trim() : 'Folder:'
    };
  }

  // Poll for dropdown icon with timeout
  function pollForDropdownIcon(callback, timeout = 5000) {
    const startTime = Date.now();
    const pollInterval = 100;
    
    function checkForIcon() {
      const icon = document.querySelector('.header-dropdown-icon');
      
      if (icon && icon.innerHTML.trim() !== '') {
        // Icon is loaded and has content
        callback(icon);
        return;
      }
      
      if (Date.now() - startTime < timeout) {
        // Continue polling if timeout hasn't been reached
        setTimeout(checkForIcon, pollInterval);
      } else {
        // Timeout reached, proceed without icon
        console.warn('Dropdown icon not found after polling, proceeding without icon');
        callback(null);
      }
    }
    
    checkForIcon();
  }

  // Store items that need icons to be applied later
  const itemsNeedingIcons = [];

  // Function to apply icons to stored mobile items only
  function applyIconsToItems(dropdownIcon) {
    itemsNeedingIcons.forEach(item => {
      if (item.type === 'mobile') {
        const iconClone = dropdownIcon ? dropdownIcon.cloneNode(true) : document.createElement('span');
        item.element.appendChild(iconClone);
      }
    });
    itemsNeedingIcons.length = 0;
  }

  // Get language labels
  const labels = getLanguageLabels();
  
  // Handle desktop menu (keep original chevron method)
  const folderContents = document.querySelectorAll('#header .header-nav-folder-content');
  folderContents.forEach(folderContent => {
    const folderItems = Array.from(folderContent.querySelectorAll('.header-nav-folder-item'));
    folderItems.forEach((item, index) => {
      const content = item.querySelector('a');
      if (content && content.textContent.trim().startsWith('+')) {
        item.classList.add('has-dropdown');
        content.textContent = content.textContent.trim().substring(1).trim();
        const subFolderDiv = document.createElement('div');
        subFolderDiv.classList.add('header-nav-sub-folder', 'header-nav-folder-content');
        item.appendChild(subFolderDiv);
        for (let i = index + 1; i < folderItems.length; i++) {
          const sibling = folderItems[i];
          const siblingContent = sibling.querySelector('a');
          if (siblingContent && siblingContent.textContent.trim().startsWith('-')) {
            siblingContent.textContent = siblingContent.textContent.trim().substring(1).trim();
            subFolderDiv.appendChild(sibling);
          } else if (siblingContent && siblingContent.textContent.trim().startsWith('+')) {
            break;
          }
        }
      }
    });
  });
  
  // Handle mobile menu
  const mobileMenuFolders = document.querySelectorAll('.header-menu-nav-folder');
  mobileMenuFolders.forEach(folder => {
    const folderItems = Array.from(folder.querySelectorAll('.header-menu-nav-item'));
    const itemsToMove = [];
    let currentPlusItem = null;
    let currentSubfolderId = null;
    
    // First pass: identify items and prepare subfolders
    folderItems.forEach((item, index) => {
      const link = item.querySelector('a');
      if (link && link.textContent.trim().startsWith('+')) {
        currentPlusItem = item;
        currentSubfolderId = link.getAttribute('href');
        
        // Get the text content without the plus
        const textContent = link.textContent.trim().substring(1).trim();
        
        // Update the link with the dropdown icon structure
        const navItemContent = link.querySelector('.header-menu-nav-item-content');
        if (navItemContent) {
          navItemContent.innerHTML = `
            <span class="visually-hidden">${labels.folder}</span>
            <span>${textContent}</span>
          `;
          itemsNeedingIcons.push({ element: navItemContent, type: 'mobile' });
        } else {
          // If there's no nav-item-content, create one
          link.textContent = '';
          const newContent = document.createElement('div');
          newContent.classList.add('header-menu-nav-item-content');
          newContent.innerHTML = `
            <span class="visually-hidden">${labels.folder}</span>
            <span>${textContent}</span>
          `;
          link.appendChild(newContent);
          itemsNeedingIcons.push({ element: newContent, type: 'mobile' });
        }
        
        // Create subfolder
        const subFolder = document.createElement('div');
        subFolder.setAttribute('data-sub-folder', currentSubfolderId);
        subFolder.classList.add('header-menu-nav-folder');
        const subFolderContent = document.createElement('div');
        subFolderContent.classList.add('header-menu-nav-folder-content');
        
        // Clone the existing parent folder back button structure
        const existingBackBtn = document.querySelector('.header-menu-controls-control[data-action="back"]');
        let backBtn;      
        if (existingBackBtn) {
          // Clone the entire parent structure
          const parentContainer = existingBackBtn.closest('.header-menu-controls');
          backBtn = parentContainer.cloneNode(true);          
          // Update the href and remove data-action since this is our custom back button
          const clonedLink = backBtn.querySelector('.header-menu-controls-control');
          clonedLink.setAttribute('href', '#');
          clonedLink.removeAttribute('data-action');
        }
        subFolderContent.appendChild(backBtn);
        
        // Setup subfolder
        subFolder.appendChild(subFolderContent);
        item.subFolder = subFolder;
        item.subFolderContent = subFolderContent;
        
        // Add click event to open subfolder
        link.addEventListener('click', function(e) {
          e.preventDefault();
          subFolder.classList.add('header-menu-nav-folder--active');
        });
        
        // Add back button functionality
        const subFolderBackBtn = backBtn.querySelector('.header-menu-controls-control');
        if (subFolderBackBtn) {
          subFolderBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            subFolder.classList.remove('header-menu-nav-folder--active');
          });
        }
        
        // Append the subfolder to the mobile menu
        const mobileMenu = document.querySelector('.header-menu-nav-list');
        mobileMenu.appendChild(subFolder);
      } else if (link && link.textContent.trim().startsWith('-')) {
        // Remove - from the text
        const navItemContent = link.querySelector('.header-menu-nav-item-content');
        if (navItemContent) {
          navItemContent.textContent = navItemContent.textContent.trim().substring(1).trim();
        } else {
          link.textContent = link.textContent.trim().substring(1).trim();
        }
        
        // Store item for moving
        if (currentPlusItem) {
          itemsToMove.push({
            item: item,
            targetContent: currentPlusItem.subFolderContent
          });
        }
      }
    });
    
    // Second pass: move items to subfolders
    itemsToMove.forEach(moveInfo => {
      moveInfo.targetContent.appendChild(moveInfo.item);
    });
  });

  // Start polling for the dropdown icon and apply it when found
  pollForDropdownIcon(function(dropdownIcon) {
    if (dropdownIcon) {
      console.log('Dropdown icon found and loaded, applying to navigation items');
      applyIconsToItems(dropdownIcon);
    } else {
      console.log('Proceeding without dropdown icon');
    }
  });
});
