import os
import time
import inspect
import requests
import math

from ._common import print_page_error

   # Upload media >10 images
   # Change pagination to 10
   # Search & create a saved search section
   # Optional- Go to media, bookmark it? or last visited?
def test_basic(request, page_factory, project): #video 
   print("Project Detail Page tests...")
   page = page_factory(
       f"{os.path.basename(__file__)}__{inspect.stack()[0][3]}")
   page.goto(f"/{project}/project-detail")
   page.on("pageerror", print_page_error)

   print("Start: Test Pagination and image upload")  
   page.select_option('.pagination select.form-select', value="100")
   # page.wait_for_selector('text="Page 1 of 1"')
   page.wait_for_timeout(5000)

   # Initial card length
   cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
   initialCardLength = len(cards)
   newCardsLength = 15
   totalCards = initialCardLength + newCardsLength

   nasa_space_photo_1 = '/tmp/hubble-sees-the-wings-of-a-butterfly.jpg'
   if not os.path.exists(nasa_space_photo_1):
      url = 'https://images-assets.nasa.gov/image/hubble-sees-the-wings-of-a-butterfly-the-twin-jet-nebula_20283986193_o/hubble-sees-the-wings-of-a-butterfly-the-twin-jet-nebula_20283986193_o~small.jpg'
      with requests.get(url, stream=True) as r:
         r.raise_for_status()
         with open(nasa_space_photo_1, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
               if chunk:
                  f.write(chunk)

   nasa_space_photo_2 = '/tmp/layers-in-galle-crater.jpg'
   if not os.path.exists(nasa_space_photo_2):
      url = 'https://images-assets.nasa.gov/image/PIA21575/PIA21575~medium.jpg'
      with requests.get(url, stream=True) as r:
         r.raise_for_status()
         with open(nasa_space_photo_2, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
               if chunk:
                  f.write(chunk)

   nasa_space_photo_3 = '/tmp/behemoth-black-hole.jpg'
   if not os.path.exists(nasa_space_photo_3):
      url = 'https://images-assets.nasa.gov/image/behemoth-black-hole-found-in-an-unlikely-place_26209716511_o/behemoth-black-hole-found-in-an-unlikely-place_26209716511_o~medium.jpg'
      with requests.get(url, stream=True) as r:
         r.raise_for_status()
         with open(nasa_space_photo_3, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
               if chunk:
                  f.write(chunk)

   page.set_input_files('section-upload input', [nasa_space_photo_1,nasa_space_photo_2,nasa_space_photo_3,nasa_space_photo_2,nasa_space_photo_2,nasa_space_photo_3,nasa_space_photo_1,nasa_space_photo_1,nasa_space_photo_1,nasa_space_photo_1,nasa_space_photo_1,nasa_space_photo_1,nasa_space_photo_1,nasa_space_photo_1,nasa_space_photo_1])
   page.query_selector('upload-dialog').query_selector('text=Close').click()

   page.click('reload-button')
   page.wait_for_selector('section-files entity-card')
   page.wait_for_timeout(5000)

   cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
   cardLength = len(cards) # existing + new cards

   print(f"Length of cards {cardLength}  == should match totalCards {totalCards}")
   assert cardLength == totalCards

   # Test selecting less cards
   page.select_option('.pagination select.form-select', value="10")
   pages = int(math.ceil(totalCards / 10))
   page.wait_for_selector(f'text="Page 1 of {str(pages)}"')
   page.wait_for_timeout(5000)
   
   cardsHidden = page.query_selector_all('section-files entity-card[style="display: none;"]')
   cardsHiddenLength = len(cardsHidden)

   print(f"Length of cards hidden {cardsHiddenLength}  == totalCards - 10 {totalCards - 10}")
   totalMinus = totalCards - 10
   assert cardsHiddenLength == totalMinus

   cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
   cardLength = len(cards)

   print(f"Visible card length {cardLength}  == 10")
   assert cardLength == 10
   
   # Test pagination
   paginationLinks = page.query_selector_all('.pagination a')
   paginationLinks[2].click()
   page.wait_for_selector(f'text="Page 2 of {pages}"')
   page.wait_for_timeout(5000)
   
   cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
   cardLength = len(cards)
   totalOnSecond = totalCards - 10
   if totalOnSecond > 10:
      totalOnSecond = 10
   print(f"Second page length of cards {cardLength}  == {totalOnSecond}")
   assert cardLength == totalOnSecond


   href = cards[0].query_selector('a').get_attribute('href')

   # Click off the page to test the url history
   if 'annotation' in href:
      print(f"Clicking the first card to annotator....")
      cards[0].query_selector('a').click()
      page.wait_for_selector('.annotation__panel h3')
      page.go_back()
      page.wait_for_timeout(5000)

      page.wait_for_selector('section-files entity-card')
      print(f"Is pagination preserved?")

      cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
      cardLength = len(cards)
      totalOnSecond = totalCards - 10
      if totalOnSecond > 10:
         totalOnSecond = 10
      print(f"(refreshed) Second page length of cards {cardLength}  == {totalOnSecond}")
      assert cardLength == totalOnSecond
   print("Complete!") 

   # Test filtering
   print("Start: Test Filtering") 
   page.click('text="Filter"')
   page.wait_for_selector('filter-condition-group button.btn.btn-outline.btn-small')
   page.click('filter-condition-group button.btn.btn-outline.btn-small')

   page.wait_for_selector('enum-input[name="Field"]')
   page.select_option('enum-input[name="Field"] select', value="filename")

   page.wait_for_selector('text-input[name="Value"] input')
   page.fill('text-input[name="Value"] input', "black-hole")

   filterGroupButtons = page.query_selector_all('.modal__footer button')
   filterGroupButtons[0].click()

   page.wait_for_selector('text="Page 1 of 1"')
   # time.sleep(5)
   page.wait_for_timeout(5000)

   cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
   cardLength = len(cards)
   print(f"Cards length after search {cardLength} == 2")
   assert cardLength == 2

   print("Start: Test save search as section") 
   saveSearch = page.query_selector('text="Add current search"')
   saveSearch.click()

   newSectionFromSearch = "Black Holes"
   page.wait_for_selector('.modal__main input[placeholder="Give it a name..."]')
   page.fill('.modal__main input[placeholder="Give it a name..."]', newSectionFromSearch)
   saveButton = page.query_selector('text="Save"')
   saveButton.click()
   

   
   page.wait_for_selector(f'text="{newSectionFromSearch}"')
   print(f'New section created named: {newSectionFromSearch}')

   clearSearch = page.query_selector('removable-pill button')
   clearSearch.click()

   page.wait_for_selector(f'text="{totalCards} Files"')
   page.wait_for_timeout(5000)

   cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
   cardLength = len(cards)
   print(f"After search cleared cardLength {cardLength} == 10")
   assert cardLength == 10

   page.query_selector(f'text="{newSectionFromSearch}"').click()
   page.wait_for_selector('text="2 Files"')
   page.wait_for_timeout(5000)
   
   cards = page.query_selector_all('section-files entity-card[style="display: block;"]')
   cardLength = len(cards)
   print(f"Cards in saved section {cardLength} == 2")
   assert cardLength == 2
   print("Complete!") 

# def test_bulk_edit(request, page_factory, project): #video
   # print("Project Detail Page tests...")
   # page = page_factory(
   #     f"{os.path.basename(__file__)}__{inspect.stack()[0][3]}")
   # page.goto(f"/{project}/project-detail")
   # page.on("pageerror", print_page_error)

   ## Test multiple edit.....
   print("Start: Test media labels and mult edit") 
   # Show labels, and multiselect, close more menu
   page.query_selector('#icon-more-horizontal').click()
   page.wait_for_selector('text="Media Labels"')
   page.query_selector('text="Media Labels"').click()

   # select image labels & video (some in the card list and some not) @todo add video to this project
   test_string = page.query_selector_all('.entity-gallery-labels .entity-gallery-labels--checkbox-div checkbox-input[name="Test String"]')
   print(f'Label panel is open: found {len(test_string)} string labels....')
   test_string[0].click()  # for images
   test_string[2].click()  # for video
   
   page.query_selector('.enitity-gallery__labels-div nav-close').click()

   page.query_selector('#icon-more-horizontal').click()
   time.sleep(5)
   # page.wait_for_selector('id=bulkCorrectButtonDiv button')
   # print('test')
   # page.query_selector('#bulkCorrectButtonDiv button').click()

   more = page.query_selector_all('.more div div')
   print(f'more len {len(more)}')
   more[1].click()

   ## There should be two checked? 
   selected = page.query_selector('.bulk-edit-attr-choices_bulk-edit input:checked')
   # print(f'selected len {len(selected)}')

   time.sleep(2)

   ## 
   cards = page.query_selector_all('section-files entity-card')
   print(f"Selecting... {len(cards)} cards")
   
   page.keyboard.press("Control+A")

   editButton = page.query_selector('.bulk-edit-bar--right_form button')
   count = editButton.textContent

   print(f'count is {count}')
   assert count == f'{len(cards)}'


   editButton.click()


