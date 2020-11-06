import {
  ComponentCompilerEvent,
  ComponentCompilerMeta,
  ComponentCompilerProperty,
  ComponentCompilerPropertyType,
  Encapsulation,
} from '@stencil/core/internal/stencil-private';
import { generateProxyElmModule } from '../output-elm';

// This is effectively an integration test of the whole plugin. We cannot test
// elmProxyOutput (the outer layer of the plugin) easily because it is async and
// writes to the file system.
describe('generateProxyElmModule', () => {
  it('should generate an Elm module', () => {
    const cmpMeta = { ...baseCmpMeta, tagName: 'my-foo' };

    const { moduleSrc } = generateProxyElmModule(config, outputTarget, cmpMeta);
    expect(moduleSrc).toMatch(/^module Components.MyFoo exposing$/m);
  });

  it('should import necessary Elm modules', () => {
    const cmpMeta = { ...baseCmpMeta };

    const { moduleSrc } = generateProxyElmModule(config, outputTarget, cmpMeta);
    expect(moduleSrc).toContain(
      `
import Html exposing (Html, node)
import Html.Attributes exposing (attribute, property)
import Html.Events exposing (on)
import Json.Decode as Decode
import Json.Encode as Encode exposing (Value)
      `.trim(),
    );
  });

  it('should generate a view function', () => {
    const cmpMeta = { ...baseCmpMeta, tagName: 'my-foo' };

    const { moduleSrc } = generateProxyElmModule(config, outputTarget, cmpMeta);
    expect(moduleSrc).toContain(
      `
view :
    Maybe String
    -> Html msg
view slot =
    node "my-foo"
        ([ slot |> Maybe.map (attribute "slot")
         ]
            |> List.filterMap identity
        )
        []
      `.trim(),
    );
  });

  describe('with an HTML attribute-compatible prop', () => {
    let cmpMeta: ComponentCompilerMeta;

    beforeEach(() => {
      cmpMeta = {
        ...baseCmpMeta,
        tagName: 'my-foo',
        properties: [
          {
            ...baseProp,
            name: 'myProp',
            attribute: 'my-prop',
            type: 'string' as ComponentCompilerPropertyType,
            complexType: {
              original: 'string',
              resolved: 'string',
              references: {},
            },
          },
        ],
      };
    });

    it('should generate a view function that takes a Props argument', () => {
      const { moduleSrc } = generateProxyElmModule(
        config,
        outputTarget,
        cmpMeta,
      );
      expect(moduleSrc).toContain(
        `
view :
    Props
    -> Html msg
        `.trim(),
      );
    });

    it('should generate a Props type alias', () => {
      const { moduleSrc } = generateProxyElmModule(
        config,
        outputTarget,
        cmpMeta,
      );

      expect(moduleSrc).toContain(
        `
type alias Props =
    { myProp : Maybe String
    , slot : Maybe String
    }
        `.trim(),
      );
    });

    it('should export the Props type alias', () => {
      const { moduleSrc } = generateProxyElmModule(
        config,
        outputTarget,
        cmpMeta,
      );

      expect(moduleSrc).toContain(
        `
exposing
    ( view
    , Props
    )
      `.trim(),
      );
    });
  });

  describe('with an event emitter', () => {
    let cmpMeta: ComponentCompilerMeta;

    beforeEach(() => {
      cmpMeta = {
        ...baseCmpMeta,
        tagName: 'my-foo',
        events: [
          {
            ...baseEvent,
            name: 'action',
          },
        ],
      };
    });

    it('should generate a Props type alias with a type variable', () => {
      const { moduleSrc } = generateProxyElmModule(
        config,
        outputTarget,
        cmpMeta,
      );

      expect(moduleSrc).toContain(
        `
type alias Props msg =
    { slot : Maybe String
    , onAction : Maybe msg
    }
        `.trim(),
      );
    });
  });

  const config = {};
  const outputTarget = { proxiesModuleDir: './Components' };
  const baseCmpMeta: ComponentCompilerMeta = {
    assetsDirs: [],
    componentClassName: '',
    elementRef: '',
    encapsulation: 'none' as Encapsulation,
    shadowDelegatesFocus: false,
    excludeFromCollection: false,
    isCollectionDependency: false,
    isLegacy: false,
    docs: { text: '', tags: [] },
    jsFilePath: '',
    listeners: [],
    events: [],
    methods: [],
    virtualProperties: [],
    properties: [],
    watchers: [],
    sourceFilePath: '',
    states: [],
    styleDocs: [],
    styles: [],
    tagName: '',
    internal: false,
    legacyConnect: [],
    legacyContext: [],

    // ComponentCompilerFeatures
    hasAttribute: false,
    hasAttributeChangedCallbackFn: false,
    hasComponentWillLoadFn: false,
    hasComponentDidLoadFn: false,
    hasComponentShouldUpdateFn: false,
    hasComponentWillUpdateFn: false,
    hasComponentDidUpdateFn: false,
    hasComponentWillRenderFn: false,
    hasComponentDidRenderFn: false,
    hasComponentDidUnloadFn: false,
    hasConnectedCallbackFn: false,
    hasDisconnectedCallbackFn: false,
    hasElement: false,
    hasEvent: false,
    hasLifecycle: false,
    hasListener: false,
    hasListenerTarget: false,
    hasListenerTargetWindow: false,
    hasListenerTargetDocument: false,
    hasListenerTargetBody: false,
    hasListenerTargetParent: false,
    hasMember: false,
    hasMethod: false,
    hasMode: false,
    hasProp: false,
    hasPropBoolean: false,
    hasPropNumber: false,
    hasPropString: false,
    hasPropMutable: false,
    hasReflect: false,
    hasRenderFn: false,
    hasState: false,
    hasStyle: false,
    hasVdomAttribute: false,
    hasVdomClass: false,
    hasVdomFunctional: false,
    hasVdomKey: false,
    hasVdomListener: false,
    hasVdomPropOrAttr: false,
    hasVdomRef: false,
    hasVdomRender: false,
    hasVdomStyle: false,
    hasVdomText: false,
    hasVdomXlink: false,
    hasWatchCallback: false,
    htmlAttrNames: [],
    htmlTagNames: [],
    isUpdateable: false,
    isPlain: false,
    potentialCmpRefs: [],
  };

  const baseProp: ComponentCompilerProperty = {
    name: '',
    internal: false,

    // ComponentCompilerStaticProperty
    mutable: false,
    optional: false,
    required: false,
    type: 'any' as ComponentCompilerPropertyType,
    complexType: {
      original: '',
      resolved: '',
      references: {},
    },
    docs: { text: '', tags: [] },
  };

  const baseEvent: ComponentCompilerEvent = {
    internal: false,

    // ComponentCompilerStaticEvent
    name: '',
    method: '',
    bubbles: false,
    cancelable: false,
    composed: false,
    docs: { text: '', tags: [] },
    complexType: {
      original: '',
      resolved: '',
      references: {},
    },
  };
});
