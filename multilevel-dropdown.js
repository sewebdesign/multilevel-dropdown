document.addEventListener('DOMContentLoaded', function() {
  // Get language labels from the existing elements
  function getLanguageLabels() {
    // Find existing back button and folder label in the DOM to extract translations
    const existingBackBtn = document.querySelector('.header-menu-controls-control[data-action="back"]');
    const existingFolderLabel = document.querySelector('.header-menu-nav-item .visually-hidden');
    
    return {
      back: existingBackBtn ? existingBackBtn.querySelector('span:not(.chevron)').textContent.trim() : 'Back',
      folder: existingFolderLabel ? existingFolderLabel.textContent.trim() : 'Folder:'
    };
  }

  // Get language labels
  const labels = getLanguageLabels();
  
  // Handle desktop menu
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
        
        // Update the link with the right chevron structure
        const navItemContent = link.querySelector('.header-menu-nav-item-content');
        if (navItemContent) {
          navItemContent.innerHTML = `
            <span class="visually-hidden">${labels.folder}</span>
            <span>${textContent}</span>
            <span class="chevron chevron--right"></span>
          `;
        } else {
          // If there's no nav-item-content, create one
          link.textContent = ''; // Clear existing text
          const newContent = document.createElement('div');
          newContent.classList.add('header-menu-nav-item-content');
          newContent.innerHTML = `
            <span class="visually-hidden">${labels.folder}</span>
            <span>${textContent}</span>
            <span class="chevron chevron--right"></span>
          `;
          link.appendChild(newContent);
        }
        
        // Create subfolder
        const subFolder = document.createElement('div');
        subFolder.setAttribute('data-sub-folder', currentSubfolderId);
        subFolder.classList.add('header-menu-nav-folder');
        
        // Create subfolder content
        const subFolderContent = document.createElement('div');
        subFolderContent.classList.add('header-menu-nav-folder-content');
        
        // Create back button that only toggles active class
        const backBtn = document.createElement('div');
        backBtn.classList.add('header-menu-controls', 'container', 'header-menu-nav-item');
        backBtn.innerHTML = `
          <a class="header-menu-controls-control header-menu-controls-control--active" href="#" tabindex="-1">
            <span class="chevron chevron--left"></span><span>${labels.back}</span>
          </a>
        `;
        subFolderContent.appendChild(backBtn);
        
        // Setup subfolder
        subFolder.appendChild(subFolderContent);
        
        // Store references for later use
        item.subFolder = subFolder;
        item.subFolderContent = subFolderContent;
        
        // Add click event to open subfolder
        link.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Add active class to this subfolder
          subFolder.classList.add('header-menu-nav-folder--active');
        });
        
        // Add back button functionality
        const subFolderBackBtn = backBtn.querySelector('.header-menu-controls-control');
        if (subFolderBackBtn) {
          subFolderBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from this subfolder
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
});
