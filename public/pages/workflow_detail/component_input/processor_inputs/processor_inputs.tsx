/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiAccordion, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { isEmpty } from 'lodash';
import {
  IProcessorConfig,
  PROCESSOR_CONTEXT,
  PROCESSOR_TYPE,
  WorkflowConfig,
} from '../../../../../common';
import { MLProcessorInputs } from './ml_processor_inputs';
import { ConfigFieldList } from '../config_field_list';
import { TextChunkingProcessorInputs } from './text_chunking_processor_inputs';
import { NormalizationProcessorInputs } from './normalization_processor_inputs';

/**
 * Base component for rendering processor form inputs based on the processor type
 */

interface ProcessorInputsProps {
  uiConfig: WorkflowConfig;
  config: IProcessorConfig;
  baseConfigPath: string; // the base path of the nested config, if applicable. e.g., 'ingest.enrich'
  context: PROCESSOR_CONTEXT;
  disabled: boolean;
}

// Component to dynamically render the processor inputs based on the processor types.
// For most processors, we can use the standard/default ConfigFieldList components
// for rendering the required and optional fields. For more complex processors, we have
// standalone, specialized components.
export function ProcessorInputs(props: ProcessorInputsProps) {
  const configType = props.config.type;

  return (
    <EuiFlexItem grow={false}>
      {(() => {
        let el;
        switch (configType) {
          case PROCESSOR_TYPE.ML: {
            el = (
              <EuiFlexItem>
                <MLProcessorInputs
                  uiConfig={props.uiConfig}
                  config={props.config}
                  baseConfigPath={props.baseConfigPath}
                  context={props.context}
                  disabled={props.disabled}
                />
              </EuiFlexItem>
            );
            break;
          }
          case PROCESSOR_TYPE.TEXT_CHUNKING: {
            el = (
              <EuiFlexItem>
                <TextChunkingProcessorInputs
                  uiConfig={props.uiConfig}
                  config={props.config}
                  baseConfigPath={props.baseConfigPath}
                  context={props.context}
                  disabled={props.disabled}
                />
              </EuiFlexItem>
            );
            break;
          }
          case PROCESSOR_TYPE.NORMALIZATION: {
            el = (
              <EuiFlexItem>
                <NormalizationProcessorInputs
                  uiConfig={props.uiConfig}
                  config={props.config}
                  baseConfigPath={props.baseConfigPath}
                  context={props.context}
                  disabled={props.disabled}
                />
              </EuiFlexItem>
            );
            break;
          }
          default: {
            el = (
              <EuiFlexItem>
                <>
                  <ConfigFieldList
                    configId={props.config.id}
                    configFields={props.config.fields}
                    baseConfigPath={props.baseConfigPath}
                    disabled={props.disabled}
                  />
                  {!isEmpty(props.config.optionalFields) && (
                    <EuiAccordion
                      id={`advancedSettings${props.config.id}`}
                      buttonContent="Advanced settings"
                      paddingSize="none"
                    >
                      <EuiSpacer size="s" />
                      <EuiFlexItem>
                        <ConfigFieldList
                          configId={props.config.id}
                          configFields={props.config.optionalFields || []}
                          baseConfigPath={props.baseConfigPath}
                          disabled={props.disabled}
                        />
                      </EuiFlexItem>
                    </EuiAccordion>
                  )}
                </>
              </EuiFlexItem>
            );
            break;
          }
        }
        return el;
      })()}
    </EuiFlexItem>
  );
}
