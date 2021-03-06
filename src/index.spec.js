/* eslint-env mocha */
/* eslint-disable
  no-unused-expressions,
  react/jsx-filename-extension,
  import/no-extraneous-dependencies
*/

import React from 'react'
import { mount } from 'enzyme'
import { expect, spy } from 'chai'
import blanket from 'blanket' // eslint-disable-line
import loader from './index'
import TailSpin from './TailSpin'

const Component = () => <div />
const LoadingIndicator = () => <div />
const getWrapped = (config, props) => {
  const Container = loader(config)(Component)
  return mount(<Container {...props} />)
}

const isLoading = (load, loaded, CustomLoader) => {
  // Load function is called
  // Graphic component isn't called
  // LoadingIndicator should be TailSpin
  load.should.have.been.called.once
  expect(loaded.find(Component).node).to.be.undefined
  loaded.find(CustomLoader || TailSpin).node.should.exists
}

const isLoadingCustomLoader = (load, loaded) => {
  // Load function is called
  // Graphic component isn't called
  // LoadingIndicator should be `LoadingIndicator` and not `TailSpin`
  isLoading(load, loaded, LoadingIndicator)
  expect(loaded.find(TailSpin).node).to.be.undefined
}

const isLoaded = (load, loaded, CustomLoader) => {
  // Load function is not called twice
  // Graphic component is called
  // LoadingIndicator shouldn't be printed
  load.should.have.been.called.once
  loaded.find(Component).node.should.exists
  expect(loaded.find(CustomLoader || TailSpin).node).to.be.undefined
}

const isLoadedCustomLoader = (load, loaded) => {
  // Load function is not called twice
  // Graphic component is called
  // `LoadingIndicator` shouldn't be printed
  isLoaded(load, loaded, LoadingIndicator)
  expect(loaded.find(TailSpin).node).to.be.undefined
}

const isLoadedTwice = (load, loaded) => {
  // Load function is called twice
  // Graphic is printed
  // Loader shouldn't be printed
  load.should.have.been.called.twice
  loaded.find(Component).node.should.exists
  expect(loaded.find(TailSpin).node).to.be.undefined
}

describe('react-loader', () => {
  /*
   * The `loaded` default props is not set.
   * There is not `print` option.
   */
  it('should print the wrapped component by default', () => {
    const load = spy(() => {})
    const wrappedComponent = getWrapped(undefined, { load })

    isLoaded(load, wrappedComponent)
  })

  /*
   * `print` option is set as an array of one element.
   */
  it('should wait for `data` in props to be truthy', () => {
    // Mount
    const load = spy(() => {})
    const wrappedComponent = getWrapped({ print: ['data'] }, { load })

    isLoading(load, wrappedComponent)

    // Change `data` value
    wrappedComponent.setProps({ data: true })

    isLoaded(load, wrappedComponent)
  })

  /*
   * `print` option is not set, but the `loaded` parameter is.
   */
  it('should wait for the default props (`loaded`) to be truthy', () => {
    // Mount
    const load = spy(() => {})
    const wrappedComponent = getWrapped(undefined, { loaded: false, load })

    isLoading(load, wrappedComponent)

    // Change `loaded` value
    wrappedComponent.setProps({ loaded: true })

    isLoaded(load, wrappedComponent)
  })

  /*
   * `print` option is set to an array of two elements.
   */
  it('should wait for all props defined in an array of props', () => {
    // Mount
    const load = spy(() => {})
    const wrappedComponent = getWrapped({ print: ['prop1', 'prop2'] }, { load })

    isLoading(load, wrappedComponent)

    // Change `prop1` value
    wrappedComponent.setProps({ prop1: true })

    isLoading(load, wrappedComponent)

    // Change `prop3` value
    wrappedComponent.setProps({ prop3: true })

    isLoading(load, wrappedComponent)

    // Change `prop2` value
    wrappedComponent.setProps({ prop2: true })

    isLoaded(load, wrappedComponent)
  })

  /*
   * `print` option is a function.
   */
  it('should wait `print` to return a truthy value', () => {
    // Mount (false case)
    const load = spy(() => {})
    let wrappedComponent = getWrapped({ print: () => false }, { load })

    isLoading(load, wrappedComponent)

    // Mount (true case)
    wrappedComponent = getWrapped({ print: () => true }, { load })

    isLoadedTwice(load, wrappedComponent)
  })

  /*
   * `print` value is harcoded (to true).
   */
  it('should handle a hardcoded `print` value (truthy)', () => {
    // Mount
    const load = spy(() => {})
    const wrappedComponent = getWrapped({ print: true }, { load })

    isLoaded(load, wrappedComponent)
  })

  /*
   * `print` value is harcoded (to false).
   */
  it('should handle a hardcoded `print` value (falsey)', () => {
    // Mount
    const load = spy(() => {})
    const wrappedComponent = getWrapped({ print: false }, { load })

    isLoading(load, wrappedComponent)
  })

  it('should print a different LoadingIndicator component', () => {
    // Mount
    const load = spy(() => {})
    const wrappedComponent = getWrapped({ LoadingIndicator, print: ['data'] }, { load })

    isLoadingCustomLoader(load, wrappedComponent)

    // Change `data` value
    wrappedComponent.setProps({ data: true })

    isLoadedCustomLoader(load, wrappedComponent)
  })

  it('should call the `load` function parameter if present', () => {
    // Mount
    const loadProp = spy(() => {})
    const loadParam = spy(() => {})
    const props = { prop1: 'prop1', load: loadProp }
    const wrappedComponent = getWrapped({ load: loadParam }, props)

    // Load function is called
    // Graphic component isn't called
    // Loader should be TailSpin
    loadProp.should.have.been.called.once
    loadProp.should.have.been.called.with(props)
    loadParam.should.have.been.called.once
    loadParam.should.have.been.called.with(props)
    expect(wrappedComponent.find(TailSpin).node).to.be.undefined
    wrappedComponent.find(Component).node.should.exists
  })

  it('should call matching props if the load parameter is a string', () => {
    // Mount
    const loadProp = spy(() => {})
    const loadPropName = 'customLoadFunction'
    const props = { prop1: 'prop1', [loadPropName]: loadProp }
    const wrappedComponent = getWrapped({ load: loadPropName }, props)

    // Load function is called
    // Graphic component isn't called
    // Loader should be TailSpin
    loadProp.should.have.been.called.once
    loadProp.should.have.been.called.with(props)
    expect(wrappedComponent.find(TailSpin).node).to.be.undefined
    wrappedComponent.find(Component).node.should.exists
  })

  it('should handle a `null` `load` props/parameter', () => {
    // Mount
    const wrappedComponent = getWrapped()

    // Graphic component isn't called
    // TailSpin should be printed
    expect(wrappedComponent.find(TailSpin).node).to.be.undefined
    wrappedComponent.find(Component).node.should.exists
  })
})

/* eslint-enable no-unused-expressions */
