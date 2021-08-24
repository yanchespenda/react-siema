import React from 'react'
import CarouselStyle from './App.module.scss'

import ReactSiema from '@yanchespenda/react-siema'
import { CarouselItem, CarouselLinkData } from './App.interface'

function App() {
  const [carouselCurrent, setCarouselCurrent] = React.useState(0)
  const carouselBar = 10000
  const carouselOptions = {
    loop: true,
    duration: 800,
    easing: "ease-in-out",
    onNext: (currentSlide: number) => { 
      setCarouselCurrent(currentSlide)
    },
    onPrev: (currentSlide: number) => {
      setCarouselCurrent(currentSlide)
    },
    onGoTo: (currentSlide: number) => {
      setCarouselCurrent(currentSlide)
    }
  }
  const [slider, setSlider] = React.useState({
    prev: () => {},
    next: () => {},
    goTo: (_index: number) => {}
  })

  const data: CarouselItem[] = []

  const getUrl = (url: string) => {
    return 'url(' + url + ')' 
  }

  const senitazeUrl = (url: string) => {
    return url.replace('#|BASE_URL|#', '/')
  }

  const generateCarousel = (item: CarouselLinkData) => {
    const isInternal = item.link.toUpperCase().indexOf('#|BASE_URL|#') > -1
    if (isInternal) {
      return (
        <a href={ senitazeUrl(item.link) }><span className={CarouselStyle.carouselContainerBoxBtnlink}>{ item.text }</span></a>
      )
    } else {
      return (
        <a target="_blank" href={ senitazeUrl(item.link) } className={CarouselStyle.carouselContainerBoxBtnlink} rel="noopener noreferrer" >
          { item.text }
        </a>
      )
    }
  }

  return (
    <React.Fragment>
      {
        data?.length > 0 ? (
          (
            <div className={CarouselStyle.carouselPreContainer}>
                <div className={CarouselStyle.carouselContainer}>
                  <div className={CarouselStyle.carouselItems}>
                    <ReactSiema ref={(siema: any) => setSlider(siema)} {...carouselOptions}>
                      {
                        data?.map((item, idx: number) => {
                          return (
                            <div className={CarouselStyle.carouselItem} key={ idx }>
                              {item.carousel_image.enable ? (
                                <div className={[CarouselStyle.carouselContainerImage, CarouselStyle.backdrop].join(' ')} style={{ backgroundImage: getUrl(item.carousel_image.img) }}></div>
                              ) : ''}
                              <div className={[CarouselStyle.carouselContainerBox, CarouselStyle.textCenter].join(' ')}>
                                <h3 className="text-base md:text-2xl lg:text-3xl cursor-default capitalize text-center">{ item.carousel_title }</h3>
                                {
                                  item.carousel_desc_data.enable && item.carousel_desc_data.desc !== 'null' ? (
                                    <div className={CarouselStyle.carouselContainerBoxSubtextContainer}>
                                      <p className={CarouselStyle.carouselContainerBoxSubtext}>
                                        { item.carousel_desc_data.desc }
                                      </p>
                                      <div className={CarouselStyle.carouselContainerBoxSubtextSpacer}></div>
                                    </div>
                                  ):''
                                }
                                {
                                  item.carousel_link_data.enable ? (
                                    <div className={CarouselStyle.textCenter}>
                                      {
                                        generateCarousel(item.carousel_link_data)
                                      }
                                    </div>
                                  ):''
                                }
                              </div>
                            </div>
                          )
                        })
                      }
                    </ReactSiema>
                  </div>
                  <div className={CarouselStyle.carouselNavigation}>
                    <div className={[CarouselStyle.carouselNavigationBtn, CarouselStyle.prev].join(' ')}>
                      <button className={CarouselStyle.carouselNavigationBtnTrigger} onClick={() => slider.prev()}>
                        <div className={CarouselStyle.carouselNavigationBtnTriggerWrap}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={CarouselStyle.SVGprev}><path d="M9.546 6.5l5.443 5.532L9.5 17.5"></path></svg>
                        </div>
                      </button>
                    </div>
                    <div className={[CarouselStyle.carouselNavigationBtn, CarouselStyle.next].join(' ')}>
                      <button className={CarouselStyle.carouselNavigationBtnTrigger} onClick={() => slider.next()}>
                        <div className={CarouselStyle.carouselNavigationBtnTriggerWrap}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={CarouselStyle.SVGnext}><path d="M9.546 6.5l5.443 5.532L9.5 17.5"></path></svg>
                        </div>
                      </button>
                    </div>
                    <div className={CarouselStyle.carouselNavigationBlock}>
                      <ul className={CarouselStyle.carouselNavigationBlockUl}>
                        {
                          data?.map((_item, idx: number) => {
                            const currentTimer = { 'animationDuration': carouselBar + 'ms' }
                            return (
                              <li className={CarouselStyle.carouselNavigationBlockLi} key={ idx }>
                                <button className={CarouselStyle.carouselNavigationBlockLiTrigger} onClick={() => slider.goTo(idx)}>
                                  <div className={CarouselStyle.carouselNavigationBlockLiTriggerWrap}>
                                    <div className={[CarouselStyle.carouselNavigationBlockLiTriggerWrapBar, `${carouselCurrent === idx ? CarouselStyle.active : ''}`, 'bg-blue-700'].join(' ')} style={ currentTimer }></div>
                                  </div>
                                </button>
                              </li>
                            )
                          })
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
          )
        ) : ''
      }
    </React.Fragment>
  )
}

export default App
