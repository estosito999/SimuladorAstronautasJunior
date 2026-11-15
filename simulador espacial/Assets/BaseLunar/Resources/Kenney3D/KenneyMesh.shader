Shader "Selene/KenneyMesh"
{
    Properties { }
    SubShader
    {
        Tags
        {
            "RenderPipeline" = "UniversalPipeline"
            "RenderType" = "Transparent"
            "Queue" = "Transparent"
        }
        Pass
        {
            Name "DepthAndVertexColor"
            Tags { "LightMode" = "SRPDefaultUnlit" }
            Cull Off
            ZWrite On
            HLSLPROGRAM
            #pragma vertex Vertex
            #pragma fragment Fragment
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            struct Attributes
            {
                float4 position : POSITION;
                half4 color : COLOR;
            };
            struct Varyings
            {
                float4 position : SV_POSITION;
                half4 color : COLOR;
            };
            Varyings Vertex(Attributes input)
            {
                Varyings output;
                output.position = TransformObjectToHClip(input.position.xyz);
                output.color = input.color;
                return output;
            }
            half4 Fragment(Varyings input) : SV_Target
            {
                return half4(input.color.rgb, 1);
            }
            ENDHLSL
        }
    }
}
